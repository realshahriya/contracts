// Add BigInt serialization support for Jest
(BigInt.prototype as any).toJSON = function() {
    return this.toString();
};