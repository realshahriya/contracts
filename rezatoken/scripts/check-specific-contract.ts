import { Address } from '@ton/core';
import { RezaToken } from '../wrappers/RezaToken';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    // The contract address from the terminal output
    const contractAddress = Address.parse("kQAlxiiyNpRBKYyj1SZO0rkc_AQqfQTdj0CjGBAF-cjr97Xt");
    
    console.log("🔍 Checking specific contract:", contractAddress.toString());
    
    const token = provider.open(RezaToken.fromAddress(contractAddress));
    
    try {
        const jettonData = await token.getGetJettonData();
        console.log("\n📊 Contract Data:");
        console.log("  - Total supply:", jettonData.totalSupply.toString());
        console.log("  - Mintable:", jettonData.mintable);
        console.log("  - Owner:", jettonData.owner.toString());
        
        // Check if this contract has transaction limits
        try {
            const limitsEnabled = await token.getGetLimitsEnabled();
            const maxTxAmount = await token.getGetMaxTxAmount();
            const maxWalletAmount = await token.getGetMaxWalletAmount();
            
            console.log("\n🚦 Transaction Limits:");
            console.log("  - Limits enabled:", limitsEnabled);
            console.log("  - Max tx amount:", maxTxAmount.toString());
            console.log("  - Max wallet amount:", maxWalletAmount.toString());
        } catch (error) {
            console.log("⚠️  Transaction limits not available (basic jetton contract)");
        }
        
    } catch (error) {
        console.log("❌ Error getting contract data:", error);
        console.log("This might be a different type of contract or not deployed yet");
    }
}