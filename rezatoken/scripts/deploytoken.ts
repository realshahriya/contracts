import { Address, toNano } from '@ton/core';
import { Token } from '../wrappers/token';
import { NetworkProvider } from '@ton/blueprint';
import { buildOnchainMetadata } from '../utils/jetton-helpers';

export async function run(provider: NetworkProvider) {
    const jettonParams = {
        name: "RezaToken",
        description: "RezaToken is a fully compliant TEP-74 Jetton token with advanced features including owner-controlled minting, public minting, and complete metadata support.",
        symbol: "RTZ",
        image: "https://raw.githubusercontent.com/your-org/rezatoken/main/logo.png",
        decimals: 9,
    };

    // Create content Cell with complete metadata
    let content = buildOnchainMetadata(jettonParams);

    const token = provider.open(await Token.fromInit(provider.sender().address as Address, content));

    console.log("Deploying RezaToken...");
    console.log("Token address:", token.address.toString());

    // Deploy the contract (simple deployment without initial mint)
    await token.send(
        provider.sender(),
        {
            value: toNano('0.05'), // Basic deployment gas
        },
        "Deploy" // Simple deployment message
    );

    await provider.waitForDeploy(token.address);

    console.log("RezaToken deployed successfully!");
    console.log("Token address:", token.address.toString());
    
    // Get token data using standard get methods
    try {
        const jettonData = await token.getGetJettonData();
        console.log("Total supply:", jettonData.totalSupply);
        console.log("Token name:", await token.getGetName());
        console.log("Token symbol:", await token.getGetSymbol());
        console.log("Decimals:", await token.getGetDecimals());

        // Verify wallet creation for deployer
        const deployerWallet = await token.getGetWalletAddress(provider.sender().address as Address);
        console.log("Deployer wallet address:", deployerWallet.toString());
    } catch (error) {
        console.log("Contract deployed but data retrieval failed (this is normal for fresh deployment)");
        console.log("You can now use the mint-tokens script to mint your first tokens!");
    }
}
