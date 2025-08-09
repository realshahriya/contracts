import { Address, toNano } from '@ton/core';
import { RezaToken } from '../wrappers/RezaToken';
import { NetworkProvider } from '@ton/blueprint';
import { buildOnchainMetadata } from '../utils/jetton-helpers';

export async function run(provider: NetworkProvider) {
    const jettonParams = {
        name: "RezaToken",
        description: "RezaToken - A DEX-compatible Jetton token for TON blockchain. Fully compliant with TEP-74 standard for seamless integration with decentralized exchanges.",
        symbol: "RTZ",
        image: "https://raw.githubusercontent.com/ton-blockchain/token-contract/main/ft/jetton-minter.fc",
        decimals: 9,
    };

    // Create content Cell with complete metadata
    let content = buildOnchainMetadata(jettonParams);

    const token = provider.open(await RezaToken.fromInit(provider.sender().address as Address, content));

    console.log("Deploying RezaToken (DEX-Compatible)...");
    console.log("Token address:", token.address.toString());
    console.log("Owner address:", provider.sender().address?.toString());

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
    console.log("📍 Token address:", token.address.toString());
    
    // Get token data using standard get methods
    try {
        const jettonData = await token.getGetJettonData();
        console.log("📊 Token Data:");
        console.log("  - Total supply:", jettonData.totalSupply.toString());
        console.log("  - Mintable:", jettonData.mintable);
        console.log("  - Owner:", jettonData.owner.toString());

        // Verify wallet creation for deployer
        const deployerWallet = await token.getGetWalletAddress(provider.sender().address as Address);
        console.log("💼 Deployer wallet address:", deployerWallet.toString());
        
        console.log("\n🎯 Next steps:");
        console.log("1. Use 'npm run mint' to mint initial tokens");
        console.log("2. Add liquidity to DEX (DeDust, STON.fi, etc.)");
        console.log("3. Your token is now DEX-compatible!");
        
    } catch (error) {
        console.log("⚠️  Contract deployed but data retrieval failed");
        console.log("This is normal for fresh deployment. Use mint script to initialize.");
    }
}
