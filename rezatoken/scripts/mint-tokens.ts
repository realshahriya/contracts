import { Address, toNano } from '@ton/core';
import { RezaToken } from '../wrappers/RezaToken';
import { NetworkProvider } from '@ton/blueprint';
import { getContractAddress, getDefaultGas, getOwnerAddress, validateConfig } from './config';

export async function run(provider: NetworkProvider) {
    console.log('🪙 Mint Tokens Script');
    console.log('='.repeat(50));

    // Validate configuration and get contract address
    validateConfig();
    const contractAddress = getContractAddress();
    const token = provider.open(RezaToken.fromAddress(contractAddress));

    try {
        // Get current contract state
        console.log('\n📊 Current Contract State:');
        const jettonData = await token.getGetJettonData();
        console.log(`Token: RezaToken (RTZ)`);
        console.log(`Total Supply: ${(Number(jettonData.totalSupply) / 1e9).toFixed(2)} RTZ`);
        console.log(`Owner: ${jettonData.owner.toString()}`);

        // Mint parameters
        const recipientAddress = getOwnerAddress() || Address.parse("EQDIccByS2ITp9P2Nd3J5L3CyFKSI-U7yBr21K-JW0fdWGlK"); // Recipient from config or fallback
        const mintAmount = toNano('1000000'); // 1,000,000 RTZ tokens

        console.log('\n🎯 Mint Configuration:');
        console.log(`Recipient: ${recipientAddress.toString()}`);
        console.log(`Amount: ${(Number(mintAmount) / 1e9).toFixed(2)} RTZ tokens`);

        // Check if minting is allowed
        if (!jettonData.mintable) {
            console.log('❌ Minting is currently disabled');
            return;
        }

        // Send mint message
        console.log('\n🚀 Sending Mint Transaction...');
        await token.send(
            provider.sender(),
            {
                value: getDefaultGas(), // Gas fee from config
            },
            {
                $$type: 'Mint',
                amount: mintAmount,
                receiver: recipientAddress
            }
        );

        console.log('✅ Mint transaction sent successfully!');
        console.log('⏳ Waiting for transaction confirmation...');

        // Wait for transaction to be processed
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Check updated state
        console.log('\n📈 Updated Contract State:');
        const updatedJettonData = await token.getGetJettonData();
        console.log(`New Total Supply: ${(Number(updatedJettonData.totalSupply) / 1e9).toFixed(2)} RTZ`);
        console.log(`Tokens Minted: ${((Number(updatedJettonData.totalSupply) - Number(jettonData.totalSupply)) / 1e9).toFixed(2)} RTZ`);

        // Get recipient wallet address
        const recipientWallet = await token.getGetWalletAddress(recipientAddress);
        console.log(`Recipient Wallet: ${recipientWallet.toString()}`);

        console.log('\n💡 Next Steps:');
        console.log('• Check recipient wallet balance');
        console.log('• Verify transaction on TON explorer');
        console.log('• Monitor total supply changes');

    } catch (error) {
        console.error('❌ Error during minting:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('• Ensure you are the contract owner');
        console.log('• Check if minting is enabled');
        console.log('• Verify sufficient gas fees');
        console.log('• Confirm recipient address is valid');
    }
}
