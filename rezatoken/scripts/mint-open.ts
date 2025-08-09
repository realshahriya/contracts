import { toNano } from '@ton/core';
import { Token } from '../wrappers/token';
import { NetworkProvider } from '@ton/blueprint';
import { getContractAddress, getDefaultGas, validateConfig } from './config';

export async function run(provider: NetworkProvider) {
    console.log('🔓 Mint Open Script - Enable Minting');
    console.log('='.repeat(50));

    // Validate configuration and get contract address
    validateConfig();
    const contractAddress = getContractAddress();
    const token = provider.open(Token.fromAddress(contractAddress));

    try {
        // Check current minting status
        console.log('\n📊 Current Contract State:');
        const jettonData = await token.getGetJettonData();
        console.log(`Current Minting Status: ${jettonData.mintable ? '✅ Enabled' : '❌ Disabled'}`);
        console.log(`Total Supply: ${(Number(jettonData.totalSupply) / 1e9).toFixed(2)} RTZ`);
        console.log(`Owner: ${jettonData.owner.toString()}`);

        if (jettonData.mintable) {
            console.log('\n✅ Minting is already enabled!');
            return;
        }

        // Get sender address (must be owner)
        const sender = provider.sender();
        const senderAddress = sender.address;
        
        if (!senderAddress) {
            throw new Error('❌ Sender address not available. Please connect your wallet.');
        }

        console.log(`\n👤 Sender: ${senderAddress.toString()}`);

        // Verify sender is the owner
        if (!senderAddress.equals(jettonData.owner)) {
            throw new Error('❌ Only the contract owner can enable minting!');
        }

        console.log('\n💡 This action will enable minting functionality');
        console.log('💡 New tokens can be minted after this transaction');

        // Confirmation prompt
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const confirm = await new Promise<string>((resolve) => {
            readline.question('\n❓ Are you sure you want to enable minting? (yes/no): ', resolve);
        });
        readline.close();

        if (confirm.toLowerCase() !== 'yes') {
            console.log('❌ Operation cancelled by user.');
            return;
        }

        // Send mint open message
        console.log('\n🔓 Enabling minting...');
        
        const gasAmount = getDefaultGas();
        console.log(`💰 Gas Amount: ${gasAmount} TON`);

        await token.send(
            sender,
            {
                value: toNano(gasAmount),
            },
            "Owner: MintOpen"
        );

        console.log('\n✅ Mint open transaction sent successfully!');
        console.log('\n📋 Transaction Details:');
        console.log(`• Action: Enable Minting`);
        console.log(`• Contract: ${contractAddress.toString()}`);
        console.log(`• Sender: ${senderAddress.toString()}`);
        console.log(`• Gas Used: ${gasAmount} TON`);

        console.log('\n⏳ Waiting for transaction confirmation...');
        console.log('💡 Check your wallet for transaction status');
        console.log('💡 Minting will be enabled once the transaction is confirmed');

        // Wait a bit and check the new status
        setTimeout(async () => {
            try {
                const updatedData = await token.getGetJettonData();
                console.log(`\n🔄 Updated Minting Status: ${updatedData.mintable ? '✅ Enabled' : '❌ Disabled'}`);
            } catch (error) {
                console.log('\n⚠️  Could not verify updated status. Please check manually.');
            }
        }, 10000);

    } catch (error: any) {
        console.error('\n❌ Error enabling minting:', error.message);
        
        if (error.message.includes('Not Owner')) {
            console.log('\n💡 Troubleshooting:');
            console.log('• Make sure you are using the owner wallet');
            console.log('• Verify the contract address is correct');
            console.log('• Check that you are connected to the right network');
        } else if (error.message.includes('Insufficient funds')) {
            console.log('\n💡 Troubleshooting:');
            console.log('• Add more TON to your wallet for gas fees');
            console.log(`• Required: ~${getDefaultGas()} TON`);
        }
    }
}
