import { Address } from '@ton/core';
import { RezaToken } from '../wrappers/RezaToken';
import { NetworkProvider } from '@ton/blueprint';
import { extractMetadata } from '../utils/metadata-helpers';
import { getContractAddress, validateConfig } from './config';

export async function run(provider: NetworkProvider) {
    console.log('🔍 Get Wallet Address - RTZ Token');
    console.log('='.repeat(50));

    // Validate configuration and get contract address
    validateConfig();
    const contractAddress = getContractAddress();
    const token = provider.open(RezaToken.fromAddress(contractAddress));

    try {
        // Get basic token information
        const jettonData = await token.getGetJettonData();
        const metadata = extractMetadata(jettonData.content);

        console.log('\n📊 Token Information:');
        console.log('Contract Address:', contractAddress.toString());
        console.log('Name:', metadata.name);
        console.log('Symbol:', metadata.symbol);
        console.log('Owner:', jettonData.owner.toString());
        console.log('Total Supply:', jettonData.totalSupply.toString());

        // Get sender information
        const senderAddress = provider.sender().address;
        if (senderAddress) {
            console.log('\n👤 Your Information:');
            console.log('Address:', senderAddress.toString());
            
            // Get sender's jetton wallet address
            const senderWalletAddress = await token.getGetWalletAddress(senderAddress);
            console.log('Your Jetton Wallet:', senderWalletAddress.toString());
        }

        // Interactive address lookup
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log('\n🔍 Wallet Address Lookup');
        console.log('Enter addresses to get their corresponding jetton wallet addresses.');
        console.log('Type "exit" to quit.');

        while (true) {
            const addressInput = await new Promise<string>((resolve) => {
                readline.question('\n📍 Enter address (or "exit"): ', resolve);
            });

            if (addressInput.toLowerCase() === 'exit') {
                break;
            }

            try {
                const userAddress = Address.parse(addressInput);
                const walletAddress = await token.getGetWalletAddress(userAddress);
                
                console.log('\n✅ Wallet Address Found:');
                console.log('User Address:', userAddress.toString());
                console.log('Jetton Wallet:', walletAddress.toString());
                
                // Additional information
                console.log('\n📋 Additional Info:');
                console.log('- This is the jetton wallet contract for the user');
                console.log('- Send jetton transfers TO this wallet address');
                console.log('- The wallet holds the user\'s token balance');
                console.log('- Each user has a unique wallet for each jetton');
                
            } catch (error) {
                console.error('❌ Error:', error);
                console.log('Please check the address format and try again.');
            }
        }

        readline.close();
        console.log('\n👋 Goodbye!');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

async function getConnectedWalletAddress(provider: NetworkProvider, token: any, readline: any) {
    console.log('\n💳 Your Connected Wallet');
    
    const sender = provider.sender();
    const senderAddress = sender.address;
    
    if (!senderAddress) {
        console.log('❌ No wallet connected. Please connect your wallet.');
        return;
    }

    console.log(`\n👤 Your Address: ${senderAddress.toString()}`);
    
    try {
        const walletAddress = await token.getGetWalletAddress(senderAddress);
        console.log(`💳 Your Token Wallet: ${walletAddress.toString()}`);
        
        // Try to get balance if wallet exists
        console.log('\n🔍 Checking wallet status...');
        console.log('💡 Use wallet-operations script to check balance and perform transfers');
        
    } catch (error) {
        console.log('⚠️  Could not retrieve wallet address');
    }
}

async function getSingleWalletAddress(token: any, readline: any) {
    console.log('\n🔍 Single Address Lookup');
    
    const addressInput = await new Promise<string>((resolve) => {
        readline.question('Enter address to lookup: ', resolve);
    });

    try {
        const address = Address.parse(addressInput);
        const walletAddress = await token.getGetWalletAddress(address);
        
        console.log('\n📋 Lookup Results:');
        console.log(`• Owner Address: ${address.toString()}`);
        console.log(`• Token Wallet: ${walletAddress.toString()}`);
        
        // Additional info
        console.log('\n💡 Additional Information:');
        console.log('• This is the Jetton wallet address for the specified owner');
        console.log('• Use this address to check token balance');
        console.log('• Transfers should be sent to this wallet address');
        
    } catch (error: any) {
        console.log(`❌ Error: ${error.message}`);
        console.log('💡 Make sure the address format is correct (EQ... or UQ...)');
    }
}

async function getOwnerWalletAddress(token: any, ownerAddress: Address) {
    console.log('\n👑 Contract Owner Wallet');
    
    try {
        const walletAddress = await token.getGetWalletAddress(ownerAddress);
        
        console.log('\n📋 Owner Information:');
        console.log(`• Owner Address: ${ownerAddress.toString()}`);
        console.log(`• Owner Token Wallet: ${walletAddress.toString()}`);
        
        console.log('\n💡 Owner Privileges:');
        console.log('• Can mint new tokens');
        console.log('• Can transfer ownership');
        console.log('• Can update token content');
        console.log('• Can enable/disable minting');
        
    } catch (error: any) {
        console.log(`❌ Error getting owner wallet: ${error.message}`);
    }
}

async function getBatchWalletAddresses(token: any, readline: any) {
    console.log('\n📊 Batch Address Lookup');
    console.log('Enter addresses separated by commas or new lines');
    console.log('Example: EQD4FPq..., UQCr3sfr...');
    
    const addressesInput = await new Promise<string>((resolve) => {
        readline.question('\nEnter addresses: ', resolve);
    });

    const addressStrings = addressesInput
        .split(/[,\n]/)
        .map(addr => addr.trim())
        .filter(addr => addr.length > 0);

    if (addressStrings.length === 0) {
        console.log('❌ No valid addresses provided');
        return;
    }

    console.log(`\n🔍 Looking up ${addressStrings.length} addresses...`);
    console.log('='.repeat(80));

    for (let i = 0; i < addressStrings.length; i++) {
        const addressString = addressStrings[i];
        
        try {
            const address = Address.parse(addressString);
            const walletAddress = await token.getGetWalletAddress(address);
            
            console.log(`\n${i + 1}. ✅ Success`);
            console.log(`   Owner: ${address.toString()}`);
            console.log(`   Wallet: ${walletAddress.toString()}`);
            
        } catch (error: any) {
            console.log(`\n${i + 1}. ❌ Failed`);
            console.log(`   Input: ${addressString}`);
            console.log(`   Error: ${error.message}`);
        }
    }

    console.log('\n✅ Batch lookup completed!');
    console.log('\n💡 Tips:');
    console.log('• Save these wallet addresses for future reference');
    console.log('• Use wallet-operations script to check balances');
    console.log('• Token transfers should be sent to the wallet addresses');
}
