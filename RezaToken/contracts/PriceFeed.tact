import "@stdlib/deploy";
import "@stdlib/ownable";

message UpdatePrice {
  tonUsdRate: Int; // TON price in USD * 1e6 (e.g. 2.5 USD = 2500000)
}

contract PriceFeed with Deployable, Ownable {
  owner: Address;
  tonUsdRate: Int;

  init(owner: Address) {
    self.owner = owner;
    self.tonUsdRate = 2500000; // default $2.5 per TON
  }

  receive(msg: UpdatePrice) {
    self.requireOwner();
    self.tonUsdRate = msg.tonUsdRate;
  }

  // Getter for TON/USD price
  get fun getTonUsdRate(): Int {
    return self.tonUsdRate;
  }

  get fun getOwner(): Address {
    return self.owner;
  }
}
