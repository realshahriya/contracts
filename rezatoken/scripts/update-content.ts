import { toNano } from '@ton/core';
import { RezaToken } from '../wrappers/RezaToken';
import { NetworkProvider } from '@ton/blueprint';
import { buildOnchainMetadata } from '../utils/jetton-helpers';
import { extractMetadata } from '../utils/metadata-helpers';
import { getContractAddress, validateConfig } from './config';

export async function run(provider: NetworkProvider) {
    console.log('📝 Update Token Content');
    console.log('='.repeat(40));

    // Validate configuration and get contract address
    validateConfig();
    const contractAddress = getContractAddress();
    const token = provider.open(RezaToken.fromAddress(contractAddress));

    try {
        // Get current token information
        console.log('\n📊 Current Token Information:');
        const jettonData = await token.getGetJettonData();
        console.log('Contract Address:', contractAddress.toString());
        console.log('Owner:', jettonData.owner.toString());
        console.log('Total Supply:', jettonData.totalSupply.toString());
        console.log('Mintable:', jettonData.mintable);

        // Check if sender is the owner
        const senderAddress = provider.sender().address;
        if (!senderAddress) {
            console.log('❌ Sender address not available');
            return;
        }

        const isOwner = senderAddress.equals(jettonData.owner);
        console.log('\n👤 Sender:', senderAddress.toString());
        console.log('Is Owner:', isOwner ? '✅ Yes' : '❌ No');

        if (!isOwner) {
            console.log('\n⚠️ Only the contract owner can update content');
            return;
        }

        // Get current metadata
        console.log('\n📋 Current Metadata:');
        const currentMetadata = extractMetadata(jettonData.content);
        const { name, symbol, decimals } = currentMetadata;
        
        console.log(`• Name: ${name}`);
        console.log(`• Symbol: ${symbol}`);
        console.log(`• Decimals: ${decimals}`);

        // Prompt for new metadata
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const newName = await new Promise<string>((resolve) => {
            readline.question(`\nEnter new name (current: ${name}): `, (answer: string) => {
                resolve(answer || name);
            });
        });

        const newSymbol = await new Promise<string>((resolve) => {
            readline.question(`Enter new symbol (current: ${symbol}): `, (answer: string) => {
                resolve(answer || symbol);
            });
        });

        const newDescription = await new Promise<string>((resolve) => {
            readline.question(`Enter new description (current: ${currentMetadata.description || 'N/A'}): `, (answer: string) => {
                resolve(answer || currentMetadata.description || '');
            });
        });

        const newImage = await new Promise<string>((resolve) => {
            readline.question(`Enter new image URL (current: ${currentMetadata.image || 'N/A'}): `, (answer: string) => {
                resolve(answer || currentMetadata.image || '');
            });
        });

        readline.close();

        // Build new metadata
        const newMetadata = {
            name: newName,
            symbol: newSymbol,
            description: newDescription,
            image: newImage,
            decimals: decimals
        };

        const newContent = buildOnchainMetadata(newMetadata);

        console.log('\n📋 Update Summary:');
        console.log(`• Name: ${name} → ${newName}`);
        console.log(`• Symbol: ${symbol} → ${newSymbol}`);
        console.log(`• Description: ${currentMetadata.description || 'N/A'} → ${newDescription}`);
        console.log(`• Image: ${currentMetadata.image || 'N/A'} → ${newImage}`);

        const confirm = await new Promise<string>((resolve) => {
            const rl = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.question('\n❓ Confirm content update? (yes/no): ', (answer: string) => {
                rl.close();
                resolve(answer);
            });
        });

        if (confirm.toLowerCase() !== 'yes') {
            console.log('❌ Operation cancelled by user.');
            return;
        }

        // Send update content message
        console.log('\n📝 Updating token content...');
        
        const gasAmount = '0.05';
        console.log(`💰 Gas Amount: ${gasAmount} TON`);

        await token.send(
            provider.sender(),
            {
                value: toNano(gasAmount),
            },
            {
                $$type: 'TokenUpdateContent',
                content: newContent
            }
        );

        console.log('\n✅ Content update transaction sent successfully!');
        console.log('\n📋 Transaction Details:');
        console.log(`• Action: Update Token Content`);
        console.log(`• Contract: ${contractAddress.toString()}`);
        console.log(`• Sender: ${senderAddress.toString()}`);
        console.log(`• Gas Used: ${gasAmount} TON`);

        console.log('\n⏳ Waiting for transaction confirmation...');
        console.log('💡 Check your wallet for transaction status');
        console.log('💡 Content will be updated once the transaction is confirmed');

    } catch (error: any) {
        console.error('\n❌ Error updating content:', error.message);
        
        if (error.message.includes('Not Owner')) {
            console.log('\n💡 Troubleshooting:');
            console.log('• Make sure you are using the owner wallet');
            console.log('• Verify the contract address is correct');
            console.log('• Check that you are connected to the right network');
        } else if (error.message.includes('Insufficient funds')) {
            console.log('\n💡 Troubleshooting:');
            console.log('• Add more TON to your wallet for gas fees');
            console.log(`• Required: ~0.05 TON`);
        }
    }
}
