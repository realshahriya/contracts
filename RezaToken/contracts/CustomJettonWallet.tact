import "@stdlib/deploy";

message TokenTransfer {
  query_id: int as uint64;
  amount: int as coins;
  sender: address;
  response_destination: address?;
  custom_payload: cell?;
  forward_ton_amount: int as coins;
  forward_payload: slice as remaining;
}

message TokenTransferInternal {
  query_id: int as uint64;
  amount: int as coins;
  from: address;
  response_destination: address?;
  forward_ton_amount: int as coins;
  forward_payload: slice as remaining;
}

message SaleApprovalResponse {
  approved: bool;
  query_id: int as uint64;
}

message TokenNotification {
  query_id: int as uint64;
  amount: int as coins;
  from: address;
  forward_payload: slice as remaining;
}

message TokenExcesses {
  query_id: int as uint64;
}

contract CustomJettonWallet {
  balance: int as coins;
  owner: address;
  jetton: address;
  pending_transfer: (int, address, int as uint64)?; // (amount, destination, query_id)

  init(jetton: address, owner: address) {
    self.balance = 0;
    self.owner = owner;
    self.jetton = jetton;
    self.pending_transfer = null;
  }

  receive(msg: TokenTransfer) {
    let ctx = context();
    require(ctx.sender == self.owner, "Invalid sender");
    require(self.balance >= msg.amount, "Not enough tokens");

    if (msg.sender != self.owner) {
      // Prevent unauthorized call
      throw("Unauthorized");
    }

    // If sending to self or owner => unrestricted
    if (msg.custom_payload == null && msg.response_destination == null) {
      // Regular transfer
      self.transferTokens(msg);
      return;
    }

    // Check if selling (transfer to non-owner)
    let is_sell = msg.custom_payload != null || msg.response_destination != null;

    if (is_sell) {
      // Request approval from minter
      send(SendParameters{
        to: self.jetton,
        value: ton("0.1"),
        mode: SendPayGasSeparately,
        body: CheckSaleApproval{
          user: self.owner,
          amount_rtz: msg.amount,
          query_id: msg.query_id
        }.toCell()
      });
      self.pending_transfer = (msg.amount, msg.response_destination ?: msg.sender, msg.query_id);
      return;
    }

    self.transferTokens(msg);
  }

  receive(msg: SaleApprovalResponse) {
    if (self.pending_transfer == null) {
      return;
    }
    let (amount, destination, query_id) = self.pending_transfer!!;

    if (!msg.approved) {
      // Notify sender of rejection if possible
      send(SendParameters{
        to: self.owner,
        value: 0,
        mode: SendRemainingValue + SendIgnoreErrors,
        bounce: false,
        body: TokenNotification{
          query_id: query_id,
          amount: 0,
          from: myAddress(),
          forward_payload: emptySlice()
        }.toCell()
      });
      self.pending_transfer = null;
      return;
    }

    // Approved: transfer tokens
    require(self.balance >= amount, "Insufficient balance");
    self.balance -= amount;

    let init = initOf CustomJettonWallet(self.jetton, destination);
    let wallet_address = contractAddress(init);

    send(SendParameters{
      to: wallet_address,
      value: 0,
      mode: SendRemainingValue,
      bounce: true,
      body: TokenTransferInternal{
        query_id: query_id,
        amount: amount,
        from: self.owner,
        response_destination: null,
        forward_ton_amount: 0,
        forward_payload: emptySlice()
      }.toCell(),
      code: init.code,
      data: init.data
    });

    self.pending_transfer = null;
  }

  receive(msg: TokenTransferInternal) {
    let ctx = context();

    if (ctx.sender != self.jetton) {
      let sinit = initOf CustomJettonWallet(self.jetton, msg.from);
      require(contractAddress(sinit) == ctx.sender, "Invalid sender");
    }

    self.balance += msg.amount;
    require(self.balance >= 0, "Invalid balance");

    if (msg.forward_ton_amount > 0) {
      send(SendParameters{
        to: self.owner,
        value: msg.forward_ton_amount,
        mode: SendPayGasSeparately,
        bounce: false,
        body: TokenNotification{
          query_id: msg.query_id,
          amount: msg.amount,
          from: msg.from,
          forward_payload: msg.forward_payload
        }.toCell()
      });
    }

    if (msg.response_destination != null) {
      send(SendParameters{
        to: msg.response_destination!!,
        value: 0,
        mode: SendRemainingValue + SendIgnoreErrors,
        bounce: false,
        body: TokenExcesses{ query_id: msg.query_id }.toCell()
      });
    }
  }

  fun transferTokens(msg: TokenTransfer) {
    self.balance -= msg.amount;
    require(self.balance >= 0, "Negative balance");

    let init = initOf CustomJettonWallet(self.jetton, msg.sender);
    let wallet_address = contractAddress(init);

    send(SendParameters{
      to: wallet_address,
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
      }.toCell(),
      code: init.code,
      data: init.data
    });
  }

  get fun get_wallet_data(): JettonWalletData {
    return JettonWalletData{
      balance: self.balance,
      owner: self.owner,
      jetton: self.jetton,
      jetton_wallet_code: myCode()
    };
  }
}

struct JettonWalletData {
  balance: int;
  owner: address;
  jetton: address;
  jetton_wallet_code: cell;
}
