import "@stdlib/deploy";
import "@stdlib/ownable";

message UpdatePrice {
  ton_usd_rate: int; // TON price in USD * 1e6 (e.g. 2.5 USD = 2500000)
}

contract PriceFeed with Deployable, Ownable {
  owner: address;
  ton_usd_rate: int;

  init(owner: address) {
    self.owner = owner;
    self.ton_usd_rate = 2500000; // default $2.5 per TON
  }

  receive(msg: UpdatePrice) {
    self.requireOwner();
    self.ton_usd_rate = msg.ton_usd_rate;
  }

  // Getter for TON/USD price
  get fun get_ton_usd_rate(): int {
    return self.ton_usd_rate;
  }

  get fun get_owner(): address {
    return self.owner;
  }
}
