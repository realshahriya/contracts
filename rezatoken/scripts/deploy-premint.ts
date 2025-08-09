import { Address, toNano } from '@ton/core';
import { RezaToken } from '../wrappers/RezaToken';
import { NetworkProvider } from '@ton/blueprint';
import { buildOnchainMetadata } from '../utils/jetton-helpers';

export async function run(provider: NetworkProvider) {
    const jettonParams = {
        name: "RezaToken",
        description: "RezaToken - A preminted DEX-compatible Jetton token for TON blockchain. Fully compliant with TEP-74 standard.",
        symbol: "RTZ",
        image: "https://raw.githubusercontent.com/ton-blockchain/token-contract/main/ft/jetton-minter.fc",
        decimals: 9,
    };

    // Create content Cell with complete metadata
    let content = buildOnchainMetadata(jettonParams);

    const token = provider.open(await RezaToken.fromInit(provider.sender().address as Address, content));

    console.log("🚀 Deploying RezaToken (Preminted)...");
    console.log("📍 Token address:", token.address.toString());
    console.log("👑 Owner address:", provider.sender().address?.toString());

    // Deploy the contract
    await token.send(
        provider.sender(),
        {
            value: toNano('0.1'), // Sufficient gas for deployment
        },
        "Deploy"
    );

    await provider.waitForDeploy(token.address);

    console.log("✅ RezaToken deployed successfully!");
    
    // Get initial token data
    try {
        const jettonData = await token.getGetJettonData();
        console.log("📊 Initial Token Data:");
        console.log("  - Total supply:", jettonData.totalSupply.toString());
        console.log("  - Mintable:", jettonData.mintable);
        console.log("  - Owner:", jettonData.owner.toString());
    } catch (error) {
        console.log("⚠️  Initial data retrieval failed (normal for fresh deployment)");
    }

    // Premint the total supply to the owner
    const premintAmount = toNano('1000000'); // 1 Million RTZ tokens
    
    console.log("\n🪙 Preminting tokens...");
    console.log("Amount to mint:", premintAmount.toString(), "RTZ");
    
    await token.send(
        provider.sender(),
        {
            value: toNano('0.1'),
        },
        {
            $$type: 'Mint',
            amount: premintAmount,
            receiver: provider.sender().address as Address,
        }
    );

    // Wait a bit for the mint transaction to process
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Note: Minting remains enabled for future use
    console.log("💡 Minting remains enabled for future token creation");

    // Verify final state
    try {
        const finalData = await token.getGetJettonData();
        console.log("\n📊 Final Token Data:");
        console.log("  - Total supply:", finalData.totalSupply.toString());
        console.log("  - Mintable:", finalData.mintable);
        console.log("  - Owner:", finalData.owner.toString());

        // Get owner's wallet address
        const ownerWallet = await token.getGetWalletAddress(provider.sender().address as Address);
        console.log("💼 Owner wallet address:", ownerWallet.toString());
        
        console.log("\n🎯 Deployment Complete!");
        console.log("✅ Token is preminted with initial supply");
        console.log("🔓 Minting remains enabled for future use");
        console.log("🏪 Ready for DEX deployment");
        
        console.log("\n📋 Next Steps:");
        console.log("1. Deploy to DEX pools using: npm run bp scripts/deploy-dex-pools.ts");
        console.log("2. Test DEX integration: npm run bp scripts/test-dex-integration.ts");
        console.log("3. Your preminted token is ready for trading!");
        
    } catch (error) {
        console.log("⚠️  Final verification failed:", error);
        console.log("Please check token state manually using get-all-data script");
    }
}
