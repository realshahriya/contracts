import { Address } from '@ton/core';
import { RezaToken } from '../wrappers/RezaToken';
import { NetworkProvider } from '@ton/blueprint';
import { extractMetadata, formatTokenAmount } from '../utils/metadata-helpers';

export async function run(provider: NetworkProvider) {
    console.log("🔍 Checking RezaToken Contract State");
    
    // Use the deployed contract address
    const tokenAddress = Address.parse("kQCr3sfrMtkAHdzWGXvYg3qJNrfNcZQ8UHSeNCE6Er8Q-KbS");
    const token = provider.open(RezaToken.fromAddress(tokenAddress));
    
    try {
        console.log("\n📊 Basic Token Information:");
        console.log("Contract Address:", tokenAddress.toString());
        
        // Get basic token data
        const jettonData = await token.getGetJettonData();
        console.log("Total Supply:", jettonData.totalSupply.toString());
        console.log("Mintable:", jettonData.mintable);
        console.log("Owner:", jettonData.owner.toString());
        
        // Extract metadata from content
        const metadata = extractMetadata(jettonData.content);
        console.log("Name:", metadata.name);
        console.log("Symbol:", metadata.symbol);
        console.log("Decimals:", metadata.decimals);
        
        console.log("\n💰 Token Economics:");
        console.log("Max Supply: 1,000,000,000", metadata.symbol, "(1 billion)");
        console.log("Current Supply:", formatTokenAmount(jettonData.totalSupply, metadata.decimals, metadata.symbol));
        const remainingSupply = 1000000000n * (10n ** BigInt(metadata.decimals)) - jettonData.totalSupply;
        console.log("Remaining Supply:", formatTokenAmount(remainingSupply, metadata.decimals, metadata.symbol));
        
        // Test wallet address generation
        console.log("\n🏦 Wallet Address Examples:");
        const testAddresses = [
            jettonData.owner.toString(),
            "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t",
            "EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG"
        ];
        
        for (const addr of testAddresses) {
            try {
                const address = Address.parse(addr);
                const walletAddress = await token.getGetWalletAddress(address);
                const label = addr === jettonData.owner.toString() ? " (Owner)" : "";
                console.log(`${addr.slice(0, 10)}...${addr.slice(-6)}${label}:`);
                console.log(`  Wallet: ${walletAddress.toString()}`);
            } catch (e) {
                console.log(`${addr.slice(0, 10)}...${addr.slice(-6)}: Error getting wallet`);
            }
        }
        
        console.log("\n✅ Contract state check completed successfully!");
        console.log("\nℹ️  Note: This is a basic RezaToken without advanced features like");
        console.log("   sell limits, address exclusions, or DEX restrictions.");
        console.log("   The contract focuses on standard Jetton functionality with");
        console.log("   owner-controlled minting and content management.");
        
    } catch (error) {
        console.error("❌ Error checking contract state:", error);
    }
}
