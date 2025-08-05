import "@stdlib/deploy";

message TokenTransfer {
  queryId: Int as uint64;
  amount: Int as coins;
  sender: Address;
  responseDestination: Address?;
  customPayload: Cell?;
  forwardTonAmount: Int as coins;
  forwardPayload: Slice as remaining;
}

message TokenTransferInternal {
  queryId: Int as uint64;
  amount: Int as coins;
  from: Address;
  responseDestination: Address?;
  forwardTonAmount: Int as coins;
  forwardPayload: Slice as remaining;
}

message SaleApprovalResponse {
  approved: Bool;
  queryId: Int as uint64;
}

message TokenNotification {
  queryId: Int as uint64;
  amount: Int as coins;
  from: Address;
  forwardPayload: Slice as remaining;
}

message TokenExcesses {
  queryId: Int as uint64;
}

message CheckSaleApproval {
  user: Address;
  amountRtz: Int as coins;
  queryId: Int as uint64;
}

contract CustomJettonWallet {
  balance: Int as coins;
  owner: Address;
  jetton: Address;
  pendingAmount: Int as coins;
  pendingDestination: Address?;
  pendingQueryId: Int as uint64;
  hasPendingTransfer: Bool;

  init(jetton: Address, owner: Address) {
    self.balance = 0;
    self.owner = owner;
    self.jetton = jetton;
    self.pendingAmount = 0;
    self.pendingDestination = null;
    self.pendingQueryId = 0;
    self.hasPendingTransfer = false;
  }

  receive(msg: TokenTransfer) {
    let ctx = context();
    require(ctx.sender == self.owner, "Invalid sender");
    require(self.balance >= msg.amount, "Not enough tokens");

    // If sending to self or owner => unrestricted
    if (msg.customPayload == null && msg.responseDestination == null) {
      // Regular transfer
      self.transferTokens(msg);
      return;
    }

    // Check if selling (transfer to non-owner)
    let isSell = msg.customPayload != null || msg.responseDestination != null;

    if (isSell) {
      // Request approval from minter
      send(SendParameters{
        to: self.jetton,
        value: ton("0.1"),
        mode: SendPayGasSeparately,
        body: CheckSaleApproval{
          user: self.owner,
          amountRtz: msg.amount,
          queryId: msg.queryId
        }.toCell()
      });
      self.pendingAmount = msg.amount;
      if (msg.responseDestination != null) {
        self.pendingDestination = msg.responseDestination;
      } else {
        self.pendingDestination = msg.sender;
      }
      self.pendingQueryId = msg.queryId;
      self.hasPendingTransfer = true;
      return;
    }

    self.transferTokens(msg);
  }

  receive(msg: SaleApprovalResponse) {
    if (!self.hasPendingTransfer) {
      return;
    }

    if (!msg.approved) {
      // Notify sender of rejection if possible
      send(SendParameters{
        to: self.owner,
        value: 0,
        mode: SendRemainingValue + SendIgnoreErrors,
        bounce: false,
        body: TokenNotification{
          queryId: self.pendingQueryId,
          amount: 0,
          from: myAddress(),
          forwardPayload: emptySlice()
        }.toCell()
      });
      self.hasPendingTransfer = false;
      return;
    }

    // Approved: transfer tokens
    require(self.balance >= self.pendingAmount, "Insufficient balance");
    self.balance -= self.pendingAmount;

    let init = initOf CustomJettonWallet(self.jetton, self.pendingDestination!!);
    let walletAddress = contractAddress(init);

    send(SendParameters{
      to: walletAddress,
      value: 0,
      mode: SendRemainingValue,
      bounce: true,
      body: TokenTransferInternal{
        queryId: self.pendingQueryId,
        amount: self.pendingAmount,
        from: self.owner,
        responseDestination: null,
        forwardTonAmount: 0,
        forwardPayload: emptySlice()
      }.toCell(),
      code: init.code,
      data: init.data
    });

    self.hasPendingTransfer = false;
  }

  receive(msg: TokenTransferInternal) {
    let ctx = context();

    if (ctx.sender != self.jetton) {
      let sinit = initOf CustomJettonWallet(self.jetton, msg.from);
      require(contractAddress(sinit) == ctx.sender, "Invalid sender");
    }

    self.balance += msg.amount;
    require(self.balance >= 0, "Invalid balance");

    if (msg.forwardTonAmount > 0) {
      send(SendParameters{
        to: self.owner,
        value: msg.forwardTonAmount,
        mode: SendPayGasSeparately,
        bounce: false,
        body: TokenNotification{
          queryId: msg.queryId,
          amount: msg.amount,
          from: msg.from,
          forwardPayload: msg.forwardPayload
        }.toCell()
      });
    }

    if (msg.responseDestination != null) {
      send(SendParameters{
        to: msg.responseDestination!!,
        value: 0,
        mode: SendRemainingValue + SendIgnoreErrors,
        bounce: false,
        body: TokenExcesses{ queryId: msg.queryId }.toCell()
      });
    }
  }

  fun transferTokens(msg: TokenTransfer) {
    self.balance -= msg.amount;
    require(self.balance >= 0, "Negative balance");

    let init = initOf CustomJettonWallet(self.jetton, msg.sender);
    let walletAddress = contractAddress(init);

    send(SendParameters{
      to: walletAddress,
      value: 0,
      mode: SendRemainingValue,
      bounce: true,
      body: TokenTransferInternal{
        queryId: msg.queryId,
        amount: msg.amount,
        from: self.owner,
        responseDestination: msg.responseDestination,
        forwardTonAmount: msg.forwardTonAmount,
        forwardPayload: msg.forwardPayload
      }.toCell(),
      code: init.code,
      data: init.data
    });
  }

  get fun getWalletData(): JettonWalletData {
    return JettonWalletData{
      balance: self.balance,
      owner: self.owner,
      jetton: self.jetton,
      jettonWalletCode: myCode()
    };
  }
}

struct JettonWalletData {
  balance: Int;
  owner: Address;
  jetton: Address;
  jettonWalletCode: Cell;
}
