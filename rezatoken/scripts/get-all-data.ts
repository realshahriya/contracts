import { Address } from '@ton/core';
import { RezaToken } from '../wrappers/RezaToken';
import { NetworkProvider } from '@ton/blueprint';
import { extractMetadata, formatTokenAmount } from '../utils/metadata-helpers';
import { CONFIG, getContractAddress } from './config';

export async function run(provider: NetworkProvider) {
    console.log('📊 Get All Data Script - RTZ Token');
    console.log('='.repeat(50));

    // Get contract address from config
    const contractAddress = getContractAddress();
    const token = provider.open(RezaToken.fromAddress(contractAddress));

    try {
        console.log('\n🔍 Fetching All Contract Data...\n');

        // Jetton Data (comprehensive info)
        console.log('🎯 JETTON DATA');
        console.log('='.repeat(30));
        
        const jettonData = await token.getGetJettonData();
        console.log(`Total Supply: ${jettonData.totalSupply.toString()}`);
        console.log(`Mintable: ${jettonData.mintable}`);
        console.log(`Owner: ${jettonData.owner.toString()}`);
        console.log(`Content Hash: ${jettonData.content.toString()}`);
        console.log(`Wallet Code Hash: ${jettonData.walletCode.toString()}`);
        
        // Extract metadata from content
        const metadata = extractMetadata(jettonData.content);
        
        // Basic Token Information
        console.log('\n📋 BASIC TOKEN INFORMATION');
        console.log('='.repeat(30));
        
        console.log(`Name: ${metadata.name}`);
        console.log(`Symbol: ${metadata.symbol}`);
        console.log(`Decimals: ${metadata.decimals}`);
        console.log(`Total Supply (formatted): ${formatTokenAmount(jettonData.totalSupply, metadata.decimals, metadata.symbol)}`);
        console.log(`Mintable: ${jettonData.mintable}`);
        
        // Owner Information
        console.log('\n👤 OWNER INFORMATION');
        console.log('='.repeat(30));
        
        try {
            const owner = await token.getOwner();
            console.log(`Owner Address: ${owner.toString()}`);
        } catch (error) {
            console.log(`Owner Address: ${jettonData.owner.toString()} (from jetton data)`);
        }
        
        // Wallet Addresses
        console.log('\n💳 WALLET ADDRESSES');
        console.log('='.repeat(30));
        
        // Get owner's wallet address
        const ownerWallet = await token.getGetWalletAddress(jettonData.owner);
        console.log(`Owner Wallet: ${ownerWallet.toString()}`);
        
        // Get wallet addresses for test addresses
        const testAddresses = [
            "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t",
            "EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG"
        ];
        
        for (const addr of testAddresses) {
            try {
                const address = Address.parse(addr);
                const walletAddress = await token.getGetWalletAddress(address);
                console.log(`${addr.slice(0, 10)}...${addr.slice(-6)} Wallet: ${walletAddress.toString()}`);
            } catch (e) {
                console.log(`${addr.slice(0, 10)}...${addr.slice(-6)} Wallet: Error getting wallet`);
            }
        }
        
        // Summary
        console.log('\n📊 SUMMARY');
        console.log('='.repeat(30));
        console.log(`Contract: ${contractAddress.toString()}`);
        console.log(`Token: ${metadata.name} (${metadata.symbol})`);
        console.log(`Supply: ${formatTokenAmount(jettonData.totalSupply, metadata.decimals, metadata.symbol)}`);
        console.log(`Status: ${jettonData.mintable ? 'Mintable' : 'Not Mintable'}`);
        console.log(`Owner: ${jettonData.owner.toString()}`);
        
        console.log('\n✅ All available contract data retrieved successfully!');
        
        console.log('\n💡 Available Getter Functions:');
        console.log('• getGetJettonData() - Complete jetton information');
        console.log('• getGetWalletAddress(owner) - Get wallet contract address');
        console.log('• getOwner() - Contract owner address');
        
        console.log('\n❌ Not Available (Basic Jetton Contract):');
        console.log('• getGetName() - Use extractMetadata() instead');
        console.log('• getGetSymbol() - Use extractMetadata() instead');
        console.log('• getGetDecimals() - Use extractMetadata() instead');
        console.log('• getGetContent() - Content is in jetton data');
        console.log('• getGetTransactionLimit() - Not implemented');
        console.log('• getIsExcludedAddress() - Not implemented');

    } catch (error) {
        console.error('❌ Error fetching contract data:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('• Verify contract address is correct');
        console.log('• Check network connectivity');
        console.log('• Ensure contract is deployed and active');
        console.log('• Try individual getter functions if some fail');
    }
}
