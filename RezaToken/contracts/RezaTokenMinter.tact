import "@stdlib/deploy";
import "@stdlib/ownable";
import "./CustomJettonWallet";

struct PendingCheck {
  user: Address;
  amountRtz: Int;
}

message Mint {
  amount: Int;
  receiver: Address;
}

message ApproveSale {
  user: Address;
  amountUsd: Int; // USD * 1e6
}





message GetTonUsdRate {
  queryId: Int as uint64;
}

message TonUsdRateResponse {
  rate: Int; // TON/USD * 1e6
  queryId: Int as uint64;
}

contract RezaTokenMinter with Deployable, Ownable {
  totalSupply: Int as coins;
  owner: Address;
  content: Cell;
  mintable: Bool;
  priceFeed: Address;
  saleApprovals: map<Address, Int>;

  // Temporary storage for async price query during approval checks
  pendingChecks: map<Int as uint64, PendingCheck>; // queryId => PendingCheck

  init(owner: Address, content: Cell, priceFeed: Address) {
    self.totalSupply = 0;
    self.owner = owner;
    self.content = content;
    self.mintable = true;
    self.priceFeed = priceFeed;
    self.saleApprovals = emptyMap();
    self.pendingChecks = emptyMap();
  }

  receive(msg: Mint) {
    let ctx = context();
    require(ctx.sender == self.owner, "Not owner");
    require(self.mintable, "Minting disabled");

    self.totalSupply += msg.amount;

    let winit = self.getJettonWalletInit(msg.receiver);

    send(SendParameters{
      to: contractAddress(winit),
      value: 0,
      mode: SendRemainingValue,
      bounce: true,
      body: TokenTransferInternal{
        queryId: 0,
        amount: msg.amount,
        from: myAddress(),
        responseDestination: myAddress(),
        forwardTonAmount: 0,
        forwardPayload: emptySlice()
      }.toCell(),
      code: winit.code,
      data: winit.data
    });
  }

  receive(msg: ApproveSale) {
    self.requireOwner();
    self.saleApprovals.set(msg.user, msg.amountUsd);
  }

  receive(msg: CheckSaleApproval) {
    // Save the request for callback, query price feed asynchronously
    let queryId = msg.queryId;
    self.pendingChecks.set(queryId, PendingCheck{
      user: msg.user,
      amountRtz: msg.amountRtz
    });

    send(SendParameters{
      to: self.priceFeed,
      value: ton("0.05"),
      mode: SendPayGasSeparately,
      bounce: true,
      body: GetTonUsdRate{
        queryId: queryId
      }.toCell()
    });
  }

  receive(msg: TonUsdRateResponse) {
    let ctx = context();
    let queryId = msg.queryId;
    let pending = self.pendingChecks.get(queryId);
    require(pending != null, "Unknown queryId");
    let pendingCheck = pending!!;

    // Remove from pending
    self.pendingChecks.set(queryId, null);

    // amountRtz is in nanoRTZ (1 RTZ = 1e18 nanoRTZ)
    // Convert token amount to RTZ floating point (int math, avoid float):
    // USD value = (amountRtz / 1e18) * (tonUsdRate / 1e6)
    // To avoid floats: usdValue = (amountRtz * tonUsdRate) / 1e24

    let usdValue = (pendingCheck.amountRtz * msg.rate) / 1000000000000000000000000; // int math

    if (usdValue <= 1000000) { // <= $1 * 1e6
      send(SendParameters{
        to: sender(),
        value: 0,
        mode: SendRemainingValue,
        body: SaleApprovalResponse{
          approved: true,
          queryId: queryId
        }.toCell()
      });
    } else {
      let approvedAmountOpt = self.saleApprovals.get(pendingCheck.user);
      if (approvedAmountOpt != null) {
        let approvedAmount = approvedAmountOpt!!;
        if (approvedAmount >= usdValue) {
          // Decrease user's allowance
          self.saleApprovals.set(pendingCheck.user, approvedAmount - usdValue);
          send(SendParameters{
            to: sender(),
            value: 0,
            mode: SendRemainingValue,
            body: SaleApprovalResponse{
              approved: true,
              queryId: queryId
            }.toCell()
          });
        } else {
          send(SendParameters{
            to: sender(),
            value: 0,
            mode: SendRemainingValue,
            body: SaleApprovalResponse{
              approved: false,
              queryId: queryId
            }.toCell()
          });
        }
      } else {
        send(SendParameters{
          to: sender(),
          value: 0,
          mode: SendRemainingValue,
          body: SaleApprovalResponse{
            approved: false,
            queryId: queryId
          }.toCell()
        });
      }
    }
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

    self.totalSupply -= msg.amount;
    require(self.totalSupply >= 0, "Invalid totalSupply");

    send(SendParameters{
      to: myAddress(),
      value: 0,
      mode: SendRemainingValue,
      bounce: true,
      body: TokenBurnNotification{
        queryId: msg.queryId,
        amount: msg.amount,
        from: myAddress(),
        responseDestination: msg.responseDestination
      }.toCell()
    });
  }

  fun mint(receiver: Address, amount: Int) {
    require(self.mintable, "Minting disabled");
    self.totalSupply += amount;

    let winit = self.getJettonWalletInit(receiver);

    send(SendParameters{
      to: contractAddress(winit),
      value: 0,
      mode: SendRemainingValue,
      bounce: true,
      body: TokenTransferInternal{
        queryId: 0,
        amount: amount,
        from: myAddress(),
        responseDestination: myAddress(),
        forwardTonAmount: 0,
        forwardPayload: emptySlice()
      }.toCell(),
      code: winit.code,
      data: winit.data
    });
  }

  get fun getJettonData(): JettonData {
    let code = self.getJettonWalletInit(myAddress()).code;
    return JettonData{
      totalSupply: self.totalSupply,
      mintable: self.mintable,
      adminAddress: self.owner,
      jettonContent: self.content,
      jettonWalletCode: code
    };
  }

  get fun getWalletAddress(ownerAddress: Address): Address {
    let winit = self.getJettonWalletInit(ownerAddress);
    return contractAddress(winit);
  }

  fun getJettonWalletInit(address: Address): StateInit {
    return initOf CustomJettonWallet(myAddress(), address);
  }

  // Jetton Metadata
  get fun name(): String { return "RezaToken"; }
  get fun symbol(): String { return "RTZ"; }
  get fun decimals(): Int { return 18; }
}

struct JettonData {
  totalSupply: Int;
  mintable: Bool;
  adminAddress: Address;
  jettonContent: Cell;
  jettonWalletCode: Cell;
}

message TokenBurn {
  queryId: Int as uint64;
  amount: Int as coins;
  responseDestination: Address?;
}

message TokenBurnNotification {
  queryId: Int as uint64;
  amount: Int as coins;
  from: Address;
  responseDestination: Address?;
}
