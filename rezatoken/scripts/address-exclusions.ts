import { Address, toNano } from '@ton/core';
import { RezaToken } from '../wrappers/RezaToken';
import { NetworkProvider } from '@ton/blueprint';
import { extractMetadata } from '../utils/metadata-helpers';
import { getContractAddress, validateConfig, getDefaultGas } from './config';

export async function run(provider: NetworkProvider) {
    console.log('🚫 Address Exclusions Management - RTZ Token');
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

        // Get sender information
        const senderAddress = provider.sender().address;
        if (!senderAddress) {
            console.log('❌ No sender address available');
            return;
        }

        console.log('\n👤 Sender Information:');
        console.log('Address:', senderAddress.toString());
        console.log('Is Owner:', senderAddress.equals(jettonData.owner) ? '✅ Yes' : '❌ No');

        if (!senderAddress.equals(jettonData.owner)) {
            console.log('❌ Only the contract owner can manage address exclusions');
            return;
        }

        console.log('\n🚫 Address Exclusions Management');
        console.log('='.repeat(40));
        console.log('ℹ️ Note: This contract has basic jetton functionality.');
        console.log('ℹ️ Advanced exclusion features may not be available.');

        // Interactive exclusion management
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log('\n🚫 Exclusion Management Options:');
        console.log('1. Show exclusion instructions');
        console.log('2. Display contract capabilities');
        console.log('3. Get wallet address for any address');

        const choice = await new Promise<string>((resolve) => {
            readline.question('\n🔢 Select option (1-3): ', resolve);
        });

        switch (choice) {
            case '1':
                await showExclusionInstructions();
                break;
            case '2':
                await displayContractCapabilities(token);
                break;
            case '3':
                await getWalletAddress(token, readline);
                break;
            default:
                console.log('❌ Invalid choice');
        }

        readline.close();

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

async function getWalletAddress(token: any, readline: any) {
    console.log('\n📍 Get Wallet Address');
    
    const addressStr = await new Promise<string>((resolve) => {
        readline.question('\n📍 Enter address to get jetton wallet for: ', resolve);
    });

    try {
        const address = Address.parse(addressStr);
        const walletAddress = await token.getGetWalletAddress(address);
        
        console.log('\n📊 Wallet Information:');
        console.log('Owner Address:', address.toString());
        console.log('Jetton Wallet:', walletAddress.toString());

    } catch (error) {
        console.error('❌ Error getting wallet address:', error);
    }
}

async function showExclusionInstructions() {
    console.log('\n📖 Address Exclusion Instructions');
    console.log('='.repeat(40));
    
    console.log('\n🚫 About Address Exclusions:');
    console.log('• Address exclusions allow certain addresses to bypass restrictions');
    console.log('• Common exclusions include: DEX addresses, approved sellers, etc.');
    console.log('• Only the contract owner can manage exclusions');
    console.log('• Exclusions are typically used for trading restrictions');
    
    console.log('\n⚠️ Current Contract Limitations:');
    console.log('• This contract has basic jetton functionality');
    console.log('• Advanced exclusion features are not implemented');
    console.log('• Available methods: getGetJettonData, getGetWalletAddress, getOwner');
    
    console.log('\n💡 To implement exclusions:');
    console.log('1. Contract must have exclusion getter/setter methods');
    console.log('2. Owner must send appropriate messages to update exclusions');
    console.log('3. Contract logic must check exclusions during transfers');
    console.log('4. Consider upgrading contract for advanced features');
}

async function displayContractCapabilities(token: any) {
    console.log('\n🔍 Contract Capabilities Analysis');
    console.log('='.repeat(40));
    
    console.log('\n✅ Available Methods:');
    console.log('• getGetJettonData() - Basic token information');
    console.log('• getGetWalletAddress() - Get jetton wallet for address');
    console.log('• getOwner() - Get contract owner');
    
    console.log('\n❌ Not Available (Basic Jetton Contract):');
    console.log('• getIsApprovedSeller() - Approved seller functionality');
    console.log('• getIsDexAddress() - DEX address functionality');
    console.log('• getGetSellLimit() - Sell limit functionality');
    console.log('• Advanced exclusion management');
    
    console.log('\n📝 Summary:');
    console.log('This contract has basic jetton functionality only.');
    console.log('For advanced exclusion features, consider:');
    console.log('1. Upgrading the contract with additional methods');
    console.log('2. Implementing custom transfer restrictions');
    console.log('3. Adding owner-controlled exclusion lists');
}
