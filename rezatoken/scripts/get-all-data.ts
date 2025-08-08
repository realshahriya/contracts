import { Address, toNano } from '@ton/core';
import { Token } from '../wrappers/token';
import { NetworkProvider } from '@ton/blueprint';
import { getContractAddress, validateConfig } from './config';

export async function run(provider: NetworkProvider) {
    console.log('📊 Get All Data Script');
    console.log('='.repeat(50));

    // Validate configuration and get contract address
    validateConfig();
    const contractAddress = getContractAddress();
    const token = provider.open(Token.fromAddress(contractAddress));

    try {
        console.log('\n🔍 Fetching All Contract Data...\n');

        // Basic Token Information
        console.log('📋 BASIC TOKEN INFORMATION');
        console.log('='.repeat(30));
        
        const name = await token.getGetName();
        console.log(`Name: ${name}`);
        
        const symbol = await token.getGetSymbol();
        console.log(`Symbol: ${symbol}`);
        
        const decimals = await token.getGetDecimals();
        console.log(`Decimals: ${decimals}`);
        
        const totalSupply = await token.getGetTotalSupply();
        console.log(`Total Supply: ${totalSupply.toString()} units`);
        console.log(`Total Supply: ${(Number(totalSupply) / 1e9).toFixed(2)} ${symbol}`);
        
        const mintable = await token.getGetMintable();
        console.log(`Mintable: ${mintable}`);
        
        // Jetton Data (comprehensive info)
        console.log('\n🎯 JETTON DATA');
        console.log('='.repeat(30));
        
        const jettonData = await token.getGetJettonData();
        console.log(`Total Supply: ${jettonData.totalSupply.toString()}`);
        console.log(`Mintable: ${jettonData.mintable}`);
        console.log(`Owner: ${jettonData.owner.toString()}`);
        console.log(`Content Hash: ${jettonData.content.toString()}`);
        console.log(`Wallet Code Hash: ${jettonData.walletCode.toString()}`);
        
        // Owner Information
        console.log('\n👤 OWNER INFORMATION');
        console.log('='.repeat(30));
        
        const owner = await token.getOwner();
        console.log(`Owner Address: ${owner.toString()}`);
        
        // Transaction Limits
        console.log('\n🛡️ TRANSACTION LIMITS');
        console.log('='.repeat(30));
        
        const transactionLimit = await token.getGetTransactionLimit();
        console.log(`Transaction Limit: ${transactionLimit.toString()} units`);
        console.log(`Transaction Limit: ${(Number(transactionLimit) / 1e9).toFixed(2)} ${symbol}`);
        
        // Content Information
        console.log('\n📄 CONTENT INFORMATION');
        console.log('='.repeat(30));
        
        const content = await token.getGetContent();
        console.log(`Content Cell: ${content.toString()}`);
        
        // Test Address Exclusions
        console.log('\n🏪 ADDRESS EXCLUSION STATUS');
        console.log('='.repeat(30));
        
        // Check owner exclusion status
        const ownerExcluded = await token.getIsExcludedAddress(owner);
        console.log(`Owner Excluded: ${ownerExcluded}`);
        
        // Test some example addresses
        const testAddresses = [
            "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t",
            "EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG"
        ];
        
        for (const addr of testAddresses) {
            try {
                const address = Address.parse(addr);
                const isExcluded = await token.getIsExcludedAddress(address);
                console.log(`${addr.slice(0, 10)}...${addr.slice(-6)}: ${isExcluded ? 'Excluded' : 'Not Excluded'}`);
            } catch (e) {
                console.log(`${addr.slice(0, 10)}...${addr.slice(-6)}: Error checking`);
            }
        }
        
        // Wallet Addresses
        console.log('\n💳 WALLET ADDRESSES');
        console.log('='.repeat(30));
        
        // Get owner's wallet address
        const ownerWallet = await token.getGetWalletAddress(owner);
        console.log(`Owner Wallet: ${ownerWallet.toString()}`);
        
        // Get wallet addresses for test addresses
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
        console.log(`Token: ${name} (${symbol})`);
        console.log(`Supply: ${(Number(totalSupply) / 1e9).toFixed(2)} ${symbol}`);
        console.log(`Status: ${mintable ? 'Active' : 'Paused'}`);
        console.log(`Limit: ${(Number(transactionLimit) / 1e9).toFixed(2)} ${symbol} per transaction`);
        console.log(`Owner: ${owner.toString()}`);
        
        console.log('\n✅ All contract data retrieved successfully!');
        
        console.log('\n💡 Available Getter Functions:');
        console.log('• getGetName() - Token name');
        console.log('• getGetSymbol() - Token symbol');
        console.log('• getGetDecimals() - Token decimals');
        console.log('• getGetTotalSupply() - Current total supply');
        console.log('• getGetMintable() - Minting status');
        console.log('• getGetContent() - Token metadata content');
        console.log('• getGetTransactionLimit() - Current transaction limit');
        console.log('• getIsExcludedAddress(address) - Check if address is excluded');
        console.log('• getGetJettonData() - Complete jetton information');
        console.log('• getGetWalletAddress(owner) - Get wallet contract address');
        console.log('• getOwner() - Contract owner address');

    } catch (error) {
        console.error('❌ Error fetching contract data:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('• Verify contract address is correct');
        console.log('• Check network connectivity');
        console.log('• Ensure contract is deployed and active');
        console.log('• Try individual getter functions if some fail');
    }
}