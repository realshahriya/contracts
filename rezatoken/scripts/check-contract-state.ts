import { Address, toNano } from '@ton/core';
import { Token } from '../wrappers/token';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    console.log("🔍 Checking RezaToken Contract State");
    
    // Use the deployed contract address
    const tokenAddress = Address.parse("kQCr3sfrMtkAHdzWGXvYg3qJNrfNcZQ8UHSeNCE6Er8Q-KbS");
    const token = provider.open(Token.fromAddress(tokenAddress));
    
    try {
        console.log("\n📊 Basic Token Information:");
        console.log("Contract Address:", tokenAddress.toString());
        
        // Get basic token data
        const jettonData = await token.getGetJettonData();
        console.log("Total Supply:", jettonData.totalSupply.toString());
        console.log("Mintable:", jettonData.mintable);
        console.log("Owner:", jettonData.owner.toString());
        
        // Get token metadata
        console.log("Name:", await token.getGetName());
        console.log("Symbol:", await token.getGetSymbol());
        console.log("Decimals:", await token.getGetDecimals().toString());
        
        console.log("\n🛡️ Sell Restriction Configuration:");
        
        // Get sell restriction data
        const sellLimit = await token.getGetSellLimit();
        console.log("Sell Limit:", sellLimit.toString(), "nanotons");
        console.log("Sell Limit (TON):", Number(sellLimit) / 1e9, "TON");
        
        // Check owner approval status
        const owner = jettonData.owner;
        const isOwnerApproved = await token.getIsApprovedSeller(owner);
        console.log("Owner Approved Seller:", isOwnerApproved);
        
        // Test some example addresses
        const testAddresses = [
            "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t",
            "EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG"
        ];
        
        console.log("\n🏪 DEX Address Status:");
        for (const addr of testAddresses) {
            const address = Address.parse(addr);
            const isDex = await token.getIsDexAddress(address);
            console.log(`${addr.slice(0, 10)}...${addr.slice(-6)}: ${isDex ? "✅ DEX" : "❌ Not DEX"}`);
        }
        
        console.log("\n👤 Approved Seller Status:");
        for (const addr of testAddresses) {
            const address = Address.parse(addr);
            const isApproved = await token.getIsApprovedSeller(address);
            console.log(`${addr.slice(0, 10)}...${addr.slice(-6)}: ${isApproved ? "✅ Approved" : "❌ Not Approved"}`);
        }
        
        console.log("\n✅ Contract state check completed successfully!");
        
    } catch (error) {
        console.error("❌ Error checking contract state:", error);
    }
}