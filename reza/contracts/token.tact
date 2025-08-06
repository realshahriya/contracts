// Deploy message and traits (flattened from @stdlib/deploy and @stdlib/ownable)
message(0x946a98b6) Deploy {
    queryId: Int as uint64;
}

message(0xaff90f57) DeployOk {
    queryId: Int as uint64;
}

trait Deployable {
    receive(deploy: Deploy) {
        send(SendParameters{
            to: context().sender,
            value: 0,
            mode: SendRemainingValue,
            body: DeployOk{queryId: deploy.queryId}.toCell()
        });
    }
}

trait Ownable {
    owner: Address;
    
    fun requireOwner() {
        nativeThrowUnless(132, sender() == self.owner);
    }
    
    get fun owner(): Address {
        return self.owner;
    }
}

// Jetton Master data structure
struct JettonData {
    total_supply: Int;
    mintable: Bool;
    admin_address: Address;
    jetton_content: Cell;
    jetton_wallet_code: Cell;
}

// Jetton Wallet data structure  
struct JettonWalletData {
    balance: Int;
    owner: Address;
    jetton: Address;
    jetton_wallet_code: Cell;
}

// Standard Jetton messages
message(0x7362d09c) TokenTransfer {
    query_id: Int as uint64;
    amount: Int as coins;
    destination: Address;
    response_destination: Address?;
    custom_payload: Cell?;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining;
}

message(0x178d4519) TokenTransferInternal {
    query_id: Int as uint64;
    amount: Int as coins;
    from: Address;
    response_destination: Address?;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining;
}

message(0xd53276db) TokenExcesses {
    query_id: Int as uint64;
}

message(0x595f07bc) TokenBurn {
    query_id: Int as uint64;
    amount: Int as coins;
    response_destination: Address?;
    custom_payload: Cell?;
}

message(0x178d4519) TokenBurnNotification {
    query_id: Int as uint64;
    amount: Int as coins;
    sender: Address;
    response_destination: Address?;
}

message Mint {
    amount: Int;
    receiver: Address;
}

// Custom messages for sell restriction system
message ApproveHighValueSale {
    user: Address;
}

message RevokeApproval {
    user: Address;
}

// Message to check if transfer is allowed (from wallet to master)
message CheckTransferRestriction {
    query_id: Int as uint64;
    amount: Int as coins;
    from: Address;
    to: Address;
}

// Jetton Master Contract - RezaToken with sell restrictions
contract RezaToken with Deployable, Ownable {
    total_supply: Int as coins;
    owner: Address;
    mintable: Bool;
    content: Cell;
    
    // Sell restriction system
    max_sell_amount_usd: Int = 1000000000; // $1 worth in nanotons (1 TON = $1 for simplicity)
    approved_sellers: map<Address, Bool>; // Users approved for high-value sales
    
    init(owner: Address, content: Cell) {
        self.total_supply = 1000000 * pow(10, 9); // 1,000,000 tokens with 9 decimals
        self.owner = owner;
        self.mintable = false;
        self.content = content;
        self.approved_sellers = emptyMap();
    }
    
    // Mint new tokens (only owner)
    receive(msg: Mint) {
        self.requireOwner();
        require(self.mintable, "Token is not mintable");
        
        self.total_supply = self.total_supply + msg.amount;
        
        let wallet_init: StateInit = self.getJettonWalletInit(msg.receiver);
        send(SendParameters{
            to: contractAddress(wallet_init),
            value: ton("0.1"),
            bounce: false,
            mode: SendIgnoreErrors,
            body: TokenTransferInternal{
                query_id: 0,
                amount: msg.amount,
                from: myAddress(),
                response_destination: myAddress(),
                forward_ton_amount: 0,
                forward_payload: emptySlice()
            }.toCell(),
            code: wallet_init.code,
            data: wallet_init.data
        });
    }
    
    // Handle burn notifications from wallets
    receive(msg: TokenBurnNotification) {
        self.requireWallet(msg.sender);
        self.total_supply = self.total_supply - msg.amount;
        
        if (msg.response_destination != null) {
            send(SendParameters{
                to: msg.response_destination!!,
                value: 0,
                mode: SendRemainingValue,
                body: TokenExcesses{query_id: msg.query_id}.toCell()
            });
        }
    }
    
    // Check if a transfer should be restricted (called by wallets)
    receive(msg: CheckTransferRestriction) {
        // Only jetton wallets can call this
        self.requireWallet(context().sender);
        
        // Check if this is a potential sell (amount > $1 limit)
        let is_restricted: Bool = false;
        if (msg.amount > self.max_sell_amount_usd) {
            let approval_result: Bool? = self.approved_sellers.get(msg.from);
            let is_approved: Bool = false;
            if (approval_result != null) {
                is_approved = approval_result!!;
            }
            is_restricted = !(is_approved || msg.from == self.owner);
        }
        
        // Send response back to wallet
        send(SendParameters{
            to: context().sender,
            value: 0,
            mode: SendRemainingValue,
            body: beginCell()
                .storeUint(0x12345678, 32) // Custom response opcode
                .storeUint(msg.query_id, 64)
                .storeBool(is_restricted)
                .endCell()
        });
    }
    
    // Approve user for high-value sales
    receive(msg: ApproveHighValueSale) {
        self.requireOwner();
        self.approved_sellers.set(msg.user, true);
        
        send(SendParameters{
            to: context().sender,
            value: 0,
            mode: SendRemainingValue,
            body: "User approved for high-value sales".asComment()
        });
    }
    
    // Revoke user approval
    receive(msg: RevokeApproval) {
        self.requireOwner();
        self.approved_sellers.set(msg.user, false);
        
        send(SendParameters{
            to: context().sender,
            value: 0,
            mode: SendRemainingValue,
            body: "User approval revoked".asComment()
        });
    }
    
    // Helper function to verify sender is a valid jetton wallet
    fun requireWallet(wallet: Address) {
        let wallet_data: JettonWalletData = self.getJettonWalletData(wallet);
        require(wallet_data.jetton == myAddress(), "Invalid jetton wallet");
    }
    
    // Calculate jetton wallet address
    fun getJettonWalletInit(owner_address: Address): StateInit {
        return StateInit{
            code: self.getJettonWalletCode(),
            data: beginCell()
                .storeAddress(owner_address)
                .storeAddress(myAddress())
                .endCell()
        };
    }
    
    // Get jetton wallet data (placeholder - would need actual implementation)
    fun getJettonWalletData(wallet: Address): JettonWalletData {
        // This is a placeholder - in real implementation, you'd query the wallet
        return JettonWalletData{
            balance: 0,
            owner: wallet,
            jetton: myAddress(),
            jetton_wallet_code: beginCell().endCell()
        };
    }
    
    // Standard Jetton getters
    get fun get_jetton_data(): JettonData {
        let wallet_code: Cell = self.getJettonWalletCode();
        return JettonData{
            total_supply: self.total_supply,
            mintable: self.mintable,
            admin_address: self.owner,
            jetton_content: self.content,
            jetton_wallet_code: wallet_code
        };
    }
    
    get fun get_wallet_address(owner_address: Address): Address {
        return contractAddress(self.getJettonWalletInit(owner_address));
    }
    
    // Custom getters for sell restriction system
    get fun get_max_sell_limit(): Int {
        return self.max_sell_amount_usd;
    }
    
    get fun is_approved_seller(user: Address): Bool {
        let approval_result: Bool? = self.approved_sellers.get(user);
        if (approval_result != null) {
            return approval_result!!;
        }
        return false;
    }
    
    // Token metadata getters
    get fun get_token_name(): String {
        return "RezaToken";
    }
    
    get fun get_token_symbol(): String {
        return "RTZ";
    }
    
    get fun get_decimals(): Int {
        return 9;
    }
    
    // Get jetton wallet code
    fun getJettonWalletCode(): Cell {
        // Return a simple placeholder code cell
        return beginCell()
            .storeUint(0, 8) // Simple placeholder wallet code
            .endCell();
    }
}

// Jetton Wallet Contract - Handles individual user balances with sell restrictions
contract JettonWallet {
    balance: Int as coins;
    owner: Address;
    jetton: Address;
    
    init(owner: Address, jetton: Address) {
        self.balance = 0;
        self.owner = owner;
        self.jetton = jetton;
    }
    
    // Handle incoming token transfers
    receive(msg: TokenTransferInternal) {
        let ctx: Context = context();
        
        if (ctx.sender == self.jetton) {
            // Mint tokens (from jetton master)
            self.balance = self.balance + msg.amount;
            
            if (msg.forward_ton_amount > 0) {
                send(SendParameters{
                    to: self.owner,
                    value: msg.forward_ton_amount,
                    mode: SendPayGasSeparately,
                    body: msg.forward_payload.asCell()
                });
            }
            
            if (msg.response_destination != null) {
                send(SendParameters{
                    to: msg.response_destination!!,
                    value: 0,
                    mode: SendRemainingValue,
                    body: TokenExcesses{query_id: msg.query_id}.toCell()
                });
            }
        } else {
            // Transfer from another wallet - simplified validation
            require(ctx.sender != self.jetton, "Invalid sender wallet");
            
            self.balance = self.balance + msg.amount;
            
            if (msg.forward_ton_amount > 0) {
                send(SendParameters{
                    to: self.owner,
                    value: msg.forward_ton_amount,
                    mode: SendPayGasSeparately,
                    body: msg.forward_payload.asCell()
                });
            }
            
            if (msg.response_destination != null) {
                send(SendParameters{
                    to: msg.response_destination!!,
                    value: 0,
                    mode: SendRemainingValue,
                    body: TokenExcesses{query_id: msg.query_id}.toCell()
                });
            }
        }
    }
    
    // Handle outgoing token transfers with sell restriction check
    receive(msg: TokenTransfer) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Only owner can transfer");
        require(self.balance >= msg.amount, "Insufficient balance");
        
        // Check sell restrictions with jetton master
        send(SendParameters{
            to: self.jetton,
            value: ton("0.05"),
            mode: SendPayGasSeparately,
            body: CheckTransferRestriction{
                query_id: msg.query_id,
                amount: msg.amount,
                from: self.owner,
                to: msg.destination
            }.toCell()
        });
        
        // Store transfer details for when restriction check returns
        // In a full implementation, you'd store this in contract state
        // For now, we'll proceed with the transfer assuming it's allowed
        self.executeTransfer(msg);
    }
    
    // Execute the actual transfer
    fun executeTransfer(msg: TokenTransfer) {
        self.balance = self.balance - msg.amount;
        
        // For simplicity, send directly to destination
        // In a full implementation, you'd calculate the proper wallet address
        send(SendParameters{
            to: msg.destination,
            value: 0,
            mode: SendRemainingValue,
            bounce: true,
            body: TokenTransferInternal{
                query_id: msg.query_id,
                amount: msg.amount,
                from: self.owner,
                response_destination: msg.response_destination,
                forward_ton_amount: msg.forward_ton_amount,
                forward_payload: msg.forward_payload
            }.toCell()
        });
    }
    
    // Handle token burning
    receive(msg: TokenBurn) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Only owner can burn");
        require(self.balance >= msg.amount, "Insufficient balance");
        
        self.balance = self.balance - msg.amount;
        
        send(SendParameters{
            to: self.jetton,
            value: 0,
            mode: SendRemainingValue,
            body: TokenBurnNotification{
                query_id: msg.query_id,
                amount: msg.amount,
                sender: self.owner,
                response_destination: msg.response_destination
            }.toCell()
        });
    }
    
    // Get wallet data
    get fun get_wallet_data(): JettonWalletData {
        return JettonWalletData{
            balance: self.balance,
            owner: self.owner,
            jetton: self.jetton,
            jetton_wallet_code: beginCell().endCell()
        };
    }
}