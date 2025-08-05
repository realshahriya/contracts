import "@stdlib/deploy";
import "@stdlib/ownable";

message Mint {
  amount: int;
  receiver: address;
}

message ApproveSale {
  user: address;
  amount_usd: int; // USD * 1e6
}

message CheckSaleApproval {
  user: address;
  amount_rtz: int; // nanoRTZ tokens
  query_id: int as uint64;
}

message SaleApprovalResponse {
  approved: bool;
  query_id: int as uint64;
}

message TonUsdRateResponse {
  rate: int; // TON/USD * 1e6
  query_id: int as uint64;
}

contract RezaTokenMinter with Deployable, Ownable {
  total_supply: int as coins;
  owner: address;
  content: cell;
  mintable: bool;
  price_feed: address;
  sale_approvals: map<address, int>;

  // Temporary storage for async price query during approval checks
  pending_checks: map<int as uint64, (address, int)>; // query_id => (user, amount_rtz)

  init(owner: address, content: cell, price_feed: address) {
    self.total_supply = 0;
    self.owner = owner;
    self.content = content;
    self.mintable = true;
    self.price_feed = price_feed;
    self.pending_checks = {};
  }

  receive(msg: Mint) {
    let ctx = context();
    require(ctx.sender == self.owner, "Not owner");
    require(self.mintable, "Minting disabled");

    self.total_supply += msg.amount;

    let winit = self.getJettonWalletInit(msg.receiver);

    send(SendParameters{
      to: contractAddress(winit),
      value: 0,
      mode: SendRemainingValue,
      bounce: true,
      body: TokenTransferInternal{
        query_id: 0,
        amount: msg.amount,
        from: myAddress(),
        response_destination: myAddress(),
        forward_ton_amount: 0,
        forward_payload: emptySlice()
      }.toCell(),
      code: winit.code,
      data: winit.data
    });
  }

  receive(msg: ApproveSale) {
    self.requireOwner();
    self.sale_approvals.set(msg.user, msg.amount_usd);
  }

  receive(msg: CheckSaleApproval) {
    // Save the request for callback, query price feed asynchronously
    let query_id = msg.query_id;
    self.pending_checks.set(query_id, (msg.user, msg.amount_rtz));

    send(SendParameters{
      to: self.price_feed,
      value: ton("0.05"),
      mode: SendPayGasSeparately,
      bounce: true,
      body: (GetResponseAddress => TonUsdRateResponse) {
        query_id: query_id
      }.toCell()
    });
  }

  receive(msg: TonUsdRateResponse) {
    let ctx = context();
    let query_id = msg.query_id;
    let pending = self.pending_checks.get(query_id);
    require(pending != null, "Unknown query_id");
    let (user, amount_rtz) = pending!!;

    // Remove from pending
    self.pending_checks.delete(query_id);

    // amount_rtz is in nanoRTZ (1 RTZ = 1e18 nanoRTZ)
    // Convert token amount to RTZ floating point (int math, avoid float):
    // USD value = (amount_rtz / 1e18) * (ton_usd_rate / 1e6)
    // To avoid floats: usd_value = (amount_rtz * ton_usd_rate) / 1e24

    let usd_value = (amount_rtz * msg.rate) / 1000000000000000000000000; // int math

    var is_approved = false;

    if (usd_value <= 1000000) { // <= $1 * 1e6
      is_approved = true;
    } else {
      let approved_amount_opt = self.sale_approvals.get(user);
      if (approved_amount_opt != null) {
        let approved_amount = approved_amount_opt!!;
        if (approved_amount >= usd_value) {
          is_approved = true;
          // Decrease user's allowance
          self.sale_approvals.set(user, approved_amount - usd_value);
        }
      }
    }

    send(SendParameters{
      to: sender(),
      value: 0,
      mode: SendRemainingValue,
      body: SaleApprovalResponse{
        approved: is_approved,
        query_id: query_id
      }.toCell()
    });
  }

  receive("Mint: 100") {
    let ctx = context();
    require(ctx.sender == self.owner, "Not owner");
    self.mint(ctx.sender, ton("100"));
  }

  receive("Owner: MintClose") {
    let ctx = context();
    require(ctx.sender == self.owner, "Not owner");
    self.mintable = false;
  }

  receive(msg: TokenBurn) {
    let ctx = context();
    require(ctx.sender == self.owner, "Not owner");

    self.total_supply -= msg.amount;
    require(self.total_supply >= 0, "Invalid total_supply");

    send(SendParameters{
      to: myAddress(),
      value: 0,
      mode: SendRemainingValue,
      bounce: true,
      body: TokenBurnNotification{
        query_id: msg.query_id,
        amount: msg.amount,
        from: myAddress(),
        response_destination: msg.response_destination
      }.toCell()
    });
  }

  fun mint(receiver: address, amount: int) {
    require(self.mintable, "Minting disabled");
    self.total_supply += amount;

    let winit = self.getJettonWalletInit(receiver);

    send(SendParameters{
      to: contractAddress(winit),
      value: 0,
      mode: SendRemainingValue,
      bounce: true,
      body: TokenTransferInternal{
        query_id: 0,
        amount: amount,
        from: myAddress(),
        response_destination: myAddress(),
        forward_ton_amount: 0,
        forward_payload: emptySlice()
      }.toCell(),
      code: winit.code,
      data: winit.data
    });
  }

  get fun get_jetton_data(): JettonData {
    let code = self.getJettonWalletInit(myAddress()).code;
    return JettonData{
      total_supply: self.total_supply,
      mintable: self.mintable,
      admin_address: self.owner,
      jetton_content: self.content,
      jetton_wallet_code: code
    };
  }

  get fun get_wallet_address(owner_address: address): address {
    let winit = self.getJettonWalletInit(owner_address);
    return contractAddress(winit);
  }

  fun getJettonWalletInit(address: address): StateInit {
    return initOf CustomJettonWallet(myAddress(), address);
  }

  // Jetton Metadata
  get fun name(): string { return "RezaToken"; }
  get fun symbol(): string { return "RTZ"; }
  get fun decimals(): int { return 18; }
}

struct JettonData {
  total_supply: int;
  mintable: bool;
  admin_address: address;
  jetton_content: cell;
  jetton_wallet_code: cell;
}

message TokenBurn {
  query_id: int as uint64;
  amount: int as coins;
  response_destination: address?;
}

message TokenBurnNotification {
  query_id: int as uint64;
  amount: int as coins;
  from: address;
  response_destination: address?;
}

message TokenTransferInternal {
  query_id: int as uint64;
  amount: int as coins;
  from: address;
  response_destination: address?;
  forward_ton_amount: int as coins;
  forward_payload: slice as remaining;
}

message TokenTransfer {
  query_id: int as uint64;
  amount: int as coins;
  sender: address;
  response_destination: address?;
  custom_payload: cell?;
  forward_ton_amount: int as coins;
  forward_payload: slice as remaining;
}
