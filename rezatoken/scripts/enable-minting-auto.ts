import { Address, toNano } from '@ton/core';
import { RezaToken } from '../wrappers/RezaToken';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    // The contract address from the terminal output
    const contractAddress = Address.parse("kQAlxiiyNpRBKYyj1SZO0rkc_AQqfQTdj0CjGBAF-cjr97Xt");
    
    console.log("🔓 Enabling minting on contract:", contractAddress.toString());
    
    const token = provider.open(RezaToken.fromAddress(contractAddress));
    
    try {
        // Check current state
        const jettonData = await token.getGetJettonData();
        console.log("\n📊 Current Contract State:");
        console.log("  - Total supply:", jettonData.totalSupply.toString());
        console.log("  - Mintable:", jettonData.mintable);
        console.log("  - Owner:", jettonData.owner.toString());
        
        if (jettonData.mintable) {
            console.log("✅ Minting is already enabled!");
            return;
        }
        
        // Verify we are the owner
        const ownerAddress = provider.sender().address;
        if (!ownerAddress || !jettonData.owner.equals(ownerAddress)) {
            console.log("❌ Error: You are not the owner of this contract");
            console.log("  Your address:", ownerAddress?.toString());
            console.log("  Owner address:", jettonData.owner.toString());
            return;
        }
        
        console.log("\n🔓 Sending MintOpen message...");
        await token.send(
            provider.sender(),
            {
                value: toNano('0.05'),
            },
            "Owner: MintOpen"
        );
        
        console.log("✅ MintOpen transaction sent!");
        console.log("⏳ Waiting for transaction to process...");
        
        // Wait for transaction to process
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Verify the change
        const updatedData = await token.getGetJettonData();
        console.log("\n📊 Updated Contract State:");
        console.log("  - Total supply:", updatedData.totalSupply.toString());
        console.log("  - Mintable:", updatedData.mintable);
        console.log("  - Owner:", updatedData.owner.toString());
        
        if (updatedData.mintable) {
            console.log("\n🎉 SUCCESS: Minting has been enabled!");
        } else {
            console.log("\n⚠️  Minting is still disabled. Transaction may need more time to process.");
        }
        
    } catch (error) {
        console.log("❌ Error:", error);
    }
}