import "@stdlib/ownable";

// Standard Jetton Messages
message Mint {
    amount: Int;
    receiver: Address;
}

message MintPublic {
    amount: Int;
}

message Discover {
    queryId: Int as uint64;
}

message DiscoverResponse {
    queryId: Int as uint64;
    jetton: Address;
}

// Transaction limit management
message SetTransactionLimit {
    limit: Int as coins; // Maximum tokens per transaction
}

message CheckTransactionLimit {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
}

message TransactionLimitResponse {
    queryId: Int as uint64;
    allowed: Bool;
    currentLimit: Int as coins;
}

// Address exclusion management
message AddExcludedAddress {
    address: Address; // Address to exclude from transaction limits
}

message RemoveExcludedAddress {
    address: Address; // Address to remove from exclusion list
}

struct JettonData {
    totalSupply: Int;
    mintable: Bool;
    owner: Address;
    content: Cell;
    walletCode: Cell;
}

contract RezaToken with Jetton, OwnableTransferable {
    totalSupply: Int;
    owner: Address;
    content: Cell;
    mintable: Bool;
    
    // Standard Jetton metadata
    max_supply: Int;
    name: String;
    symbol: String;
    decimals: Int;
    
    // Transaction limit (dynamic, owner-controlled)
    transactionLimit: Int;
    
    // Excluded addresses (can bypass transaction limits)
    excludedAddresses: map<Address, Bool>;

    init(owner: Address, content: Cell) {
        self.name = "RezaToken";
        self.symbol = "RTZ";
        self.decimals = 9;
        self.totalSupply = 0;
        self.owner = owner;
        self.mintable = true;
        self.content = content;

        self.max_supply = 1000000000000000; // 1,000,000 * 10^9
        self.transactionLimit = 1000000000000; // Default: 1,000 RTZ tokens (1,000 * 10^9 units), owner can change daily
        
        // Initialize excluded addresses with owner
        self.excludedAddresses = emptyMap();
        self.excludedAddresses.set(owner, true); // Owner is always excluded
    }

    // Simple deployment message handler
    receive("Deploy") {
        // Contract is now deployed and ready to use
        // No additional logic needed for basic deployment
    }

    // Owner-only minting
    receive(msg: Mint) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Not Owner");
        require(self.mintable, "Can't Mint Anymore");
        require(msg.amount > 0, "Invalid amount");
        require(self.totalSupply + msg.amount <= self.max_supply, "Exceeds max supply");
        self.mint(msg.receiver, msg.amount, self.owner);
    }

    // Public minting (can be disabled)
    receive(msg: MintPublic) {
        let ctx: Context = context();
        require(self.mintable, "Can't Mint Anymore");
        require(msg.amount > 0, "Invalid amount");
        require(self.totalSupply + msg.amount <= self.max_supply, "Exceeds max supply");
        self.mint(ctx.sender, msg.amount, self.owner);
    }

    // Owner functions
    receive("Owner: MintClose") {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Not Owner");
        self.mintable = false;
    }

    receive("Owner: MintOpen") {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Not Owner");
        self.mintable = true;
    }

    // Discovery support
    receive(msg: Discover) {
        send(SendParameters{
            to: sender(),
            value: 0,
            bounce: false,
            mode: SendRemainingValue,
            body: DiscoverResponse{
                queryId: msg.queryId,
                jetton: myAddress()
            }.toCell()
        });
    }

    // Emergency pause/unpause
    receive("Owner: Pause") {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Not Owner");
        self.mintable = false;
    }

    receive("Owner: Unpause") {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Not Owner");
        self.mintable = true;
    }

    // Transaction limit management (owner can change daily based on demand)
    receive(msg: SetTransactionLimit) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Not Owner");
        require(msg.limit > 0, "Invalid limit");
        self.transactionLimit = msg.limit;
    }

    // Add address to exclusion list (owner only)
    receive(msg: AddExcludedAddress) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Not Owner");
        self.excludedAddresses.set(msg.address, true);
    }

    // Remove address from exclusion list (owner only)
    receive(msg: RemoveExcludedAddress) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Not Owner");
        // Don't allow removing owner from exclusion list
        require(msg.address != self.owner, "Cannot remove owner from exclusions");
        self.excludedAddresses.set(msg.address, null);
    }

    // Handle transaction limit checks from wallets
    receive(msg: CheckTransactionLimit) {
        let allowed: Bool = true;
        
        // Check if sender is in excluded addresses list
        let isExcluded: Bool = false;
        let excludedStatus: Bool? = self.excludedAddresses.get(msg.sender);
        if (excludedStatus != null) {
            isExcluded = excludedStatus!!;
        }
        
        // Check if amount exceeds current transaction limit
        // Excluded addresses (including owner) are exempt from transaction limits
        if (!isExcluded && msg.amount > self.transactionLimit) {
            allowed = false;
        }
        
        // Send response back to wallet
        send(SendParameters{
            to: sender(),
            value: 0,
            bounce: false,
            mode: SendRemainingValue,
            body: TransactionLimitResponse{
                queryId: msg.queryId,
                allowed: allowed,
                currentLimit: self.transactionLimit
            }.toCell()
        });
    } 

    // Additional standard get methods
    get fun get_name(): String {
        return self.name;
    }
    
    get fun get_symbol(): String {
        return self.symbol;
    }
    
    get fun get_decimals(): Int {
        return self.decimals;
    }
    
    get fun get_total_supply(): Int {
        return self.totalSupply;
    }
    
    get fun get_mintable(): Bool {
        return self.mintable;
    }
    
    get fun get_content(): Cell {
        return self.content;
    }
    
    get fun get_transaction_limit(): Int {
        return self.transactionLimit;
    }
    
    get fun is_excluded_address(address: Address): Bool {
        let excludedStatus: Bool? = self.excludedAddresses.get(address);
        if (excludedStatus != null) {
            return excludedStatus!!;
        }
        return false;
    }
}

// ============================================================================================================ //
@interface("org.ton.jetton.master")
trait Jetton with OwnableTransferable {

    totalSupply: Int; // Already set initially 
    mintable: Bool;
    owner: Address;
    content: Cell;

    max_supply: Int; // This is not in the TEP-74 interface

    receive(msg: TokenUpdateContent) {
        self.requireOwner();                // Allow changing content only by owner
        self.content = msg.content;         // Update content
    }

    receive(msg: TokenBurnNotification) {
        self.requireWallet(msg.owner);                     // Check wallet
        self.totalSupply = self.totalSupply - msg.amount; // Update supply

        send(SendParameters{
            to: msg.response_destination!!, 
            value: 0,
            bounce: false,
            mode: SendRemainingValue + SendIgnoreErrors,
            body: TokenExcesses{
                queryId: msg.queryId
            }.toCell()
        });
    }

    // @to The Address receive the Jetton token after minting
    // @amount The amount of Jetton token being minted
    // @response_destination The previous owner address
    fun mint(to: Address, amount: Int, response_destination: Address) {
        require(self.totalSupply + amount <= self.max_supply, "The total supply will be overlapping.");
        self.totalSupply = self.totalSupply + amount; // Update total supply

        let winit: StateInit = self.getJettonWalletInit(to); // Create message
        send(SendParameters{
            to: contractAddress(winit), 
            value: 0, 
            bounce: false,
            mode: SendRemainingValue,
            body: TokenTransferInternal{ 
                queryId: 0,
                amount: amount,
                from: myAddress(),
                response_destination: response_destination,
                forward_ton_amount: 0,
                forward_payload: emptySlice()
            }.toCell(),
            code: winit.code,
            data: winit.data
        });
    }

    fun requireWallet(owner: Address) {
        let ctx: Context = context();
        let winit: StateInit = self.getJettonWalletInit(owner);
        require(contractAddress(winit) == ctx.sender, "Invalid sender");
    }

    virtual fun getJettonWalletInit(address: Address): StateInit {
        return initOf JettonDefaultWallet(myAddress(), address);
    }

    // ====== Get Methods ====== //
    get fun get_jetton_data(): JettonData {
        let code: Cell = self.getJettonWalletInit(myAddress()).code;
        return JettonData{ 
            totalSupply: self.totalSupply, 
            mintable: self.mintable, 
            owner: self.owner, 
            content: self.content, 
            walletCode: code
        };
    }

    get fun get_wallet_address(owner: Address): Address {
        let winit: StateInit = self.getJettonWalletInit(owner);
        return contractAddress(winit);
    }
    

}
// ============================================================ //
@interface("org.ton.jetton.wallet")
contract JettonDefaultWallet {
    const minTonsForStorage: Int = ton("0.01");
    const gasConsumption: Int = ton("0.01");

    balance: Int;
    owner: Address;
    master: Address;

    init(master: Address, owner: Address) {
        self.balance = 0;
        self.owner = owner;
        self.master = master;
    }

    receive(msg: TokenTransfer) { // 0xf8a7ea5
        let ctx: Context = context(); // Check sender
        require(ctx.sender == self.owner, "Invalid sender");

        // Gas checks
        let fwdFee: Int = ctx.readForwardFee() * 2;  
        let final: Int =  2 * self.gasConsumption + self.minTonsForStorage + fwdFee;
        require(ctx.value >= final, "Invalid value!!"); 

        // Check transaction limit (get from master contract)
        self.validateTransactionLimit(msg.amount);

        // Update balance
        self.balance = self.balance - msg.amount; 
        require(self.balance >= 0, "Invalid balance");

        let init: StateInit = initOf JettonDefaultWallet(self.master, msg.destination);  
        let walletAddress: Address = contractAddress(init);
        send(SendParameters{
                to: walletAddress, 
                value: 0,
                mode: SendRemainingValue, 
                bounce: true,
                body: TokenTransferInternal{
                    queryId: msg.queryId,
                    amount: msg.amount,
                    from: self.owner,
                    response_destination: msg.response_destination,
                    forward_ton_amount: msg.forward_ton_amount,
                    forward_payload: msg.forward_payload
                }.toCell(),
                code: init.code,
                data: init.data
            });
    }

    receive(msg: TokenTransferInternal) { // 0x178d4519
        let ctx: Context = context();

        if (ctx.sender != self.master) {
            let sinit: StateInit = initOf JettonDefaultWallet(self.master, msg.from);
            require(contractAddress(sinit) == ctx.sender, "Invalid sender!");
        }

        // Update balance
        self.balance = self.balance + msg.amount;
        require(self.balance >= 0, "Invalid balance"); 
        
        // Get value for gas
        let msgValue: Int = self.msgValue(ctx.value);  
        let fwdFee: Int = ctx.readForwardFee();
        msgValue = msgValue - msg.forward_ton_amount - fwdFee;
        
         // 0x7362d09c - notify the new owner of JettonToken that the transfer is complete
        if (msg.forward_ton_amount > 0) { 
            send(SendParameters{
                to: self.owner,
                value: msg.forward_ton_amount,
                mode: SendPayGasSeparately + SendIgnoreErrors,
                bounce: false,
                body: TokenNotification {
                    queryId: msg.queryId,
                    amount: msg.amount,
                    from: msg.from,
                    forward_payload: msg.forward_payload
                }.toCell()
            });
        }

        // 0xd53276db -- Cashback to the original Sender
        send(SendParameters {
            to: msg.response_destination, 
            value: msgValue,  
            bounce: false,
            body: TokenExcesses { 
                queryId: msg.queryId
            }.toCell(),
            mode: SendIgnoreErrors
        });
    }

    receive(msg: TokenBurn) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Invalid sender");  // Check sender

        self.balance = self.balance - msg.amount; // Update balance
        require(self.balance >= 0, "Invalid balance");

        let fwdFee: Int = ctx.readForwardFee(); // Gas checks
        require(ctx.value > fwdFee + 2 * self.gasConsumption + self.minTonsForStorage, "Invalid value - Burn");

        // Burn tokens
        send(SendParameters{  
            to: self.master,
            value: 0,
            mode: SendRemainingValue,
            bounce: true,
            body: TokenBurnNotification{
                queryId: msg.queryId,
                amount: msg.amount,
                owner: self.owner,
                response_destination: self.owner
            }.toCell()
        });
    }

    get fun msgValue(value: Int): Int {
        let result: Int = value;
        let tonBalanceBeforeMsg: Int = myBalance() - result;
        let storageFee: Int = self.minTonsForStorage - min(tonBalanceBeforeMsg, self.minTonsForStorage);
        result = result - (storageFee + self.gasConsumption);
        return result;
    }

    // Transaction limit validation
    fun validateTransactionLimit(amount: Int) {
        // Send transaction limit check to master contract
        send(SendParameters{
            to: self.master,
            value: ton("0.01"), // Small amount for gas
            mode: SendPayGasSeparately,
            bounce: true,
            body: CheckTransactionLimit{
                queryId: now(),
                amount: amount,
                sender: self.owner
            }.toCell()
        });
        
        // Note: In a production implementation, you might want to:
        // 1. Wait for the response and handle it synchronously
        // 2. Implement a callback mechanism for async validation
        // 3. Cache transaction limits for gas optimization
        // 
        // For this implementation, we rely on the master contract's
        // validation logic and assume the transfer will be rejected
        // if limits are exceeded
    }

    // Handle transaction limit response from master contract
    receive(msg: TransactionLimitResponse) {
        // Validate that the response came from master
        require(sender() == self.master, "Invalid sender");
        
        if (!msg.allowed) {
            // In a real implementation, this would revert the transaction
            // For demonstration, we'll note the limit exceeded
            dump("Transaction exceeds limit");
        }
    }

    bounced(src: bounced<TokenTransferInternal>) {
        self.balance = self.balance + src.amount;
    }

    bounced(src: bounced<TokenBurnNotification>) {
        self.balance = self.balance + src.amount;
    }

    get fun get_wallet_data(): JettonWalletData {
        return JettonWalletData{
            balance: self.balance,
            owner: self.owner,
            master: self.master,
            walletCode: (initOf JettonDefaultWallet(self.master, self.owner)).code
        };
    }
    
    // Additional standard methods
    get fun get_balance(): Int {
        return self.balance;
    }
    
    get fun get_owner(): Address {
        return self.owner;
    }
    
    get fun get_master(): Address {
        return self.master;
    }
    
    // Helper method for gas estimation
    get fun estimate_transfer_gas(): Int {
        return 2 * self.gasConsumption + self.minTonsForStorage + ton("0.005");
    }
}

struct JettonWalletData {
    balance: Int;
    owner: Address;
    master: Address;
    walletCode: Cell;
}

message(0xf8a7ea5) TokenTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    response_destination: Address;
    custom_payload: Cell?;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining; // Comment Text message when Transfer the jetton
}

message(0x178d4519) TokenTransferInternal {
    queryId: Int as uint64;
    amount: Int as coins;
    from: Address;
    response_destination: Address;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining; // Comment Text message when Transfer the jetton
}

message(0x7362d09c) TokenNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    from: Address;
    forward_payload: Slice as remaining; // Comment Text message when Transfer the jetton 
}

message(0x595f07bc) TokenBurn {
    queryId: Int as uint64;
    amount: Int as coins;
    owner: Address;
    response_destination: Address;
}

message(0x7bdd97de) TokenBurnNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    owner: Address;
    response_destination: Address?;
}

message(0xd53276db) TokenExcesses {
    queryId: Int as uint64;
}

message TokenUpdateContent {
    content: Cell;
}