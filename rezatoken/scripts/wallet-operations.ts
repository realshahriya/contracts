import { Address, toNano, beginCell } from '@ton/core';
import { Token } from '../wrappers/token';
import { NetworkProvider } from '@ton/blueprint';
import { getContractAddress, getOwnerAddress, validateConfig } from './config';

export async function run(provider: NetworkProvider) {
    console.log('💳 Wallet Operations Script');
    console.log('='.repeat(50));

    // Validate configuration and get contract address
    validateConfig();
    const contractAddress = getContractAddress();
    const token = provider.open(Token.fromAddress(contractAddress));

    try {
        // Get current contract state
        console.log('\n📊 Contract Information:');
        const jettonData = await token.getGetJettonData();
        const symbol = await token.getGetSymbol();
        console.log(`Token: ${await token.getGetName()} (${symbol})`);
        console.log(`Total Supply: ${(Number(jettonData.totalSupply) / 1e9).toFixed(2)} ${symbol}`);
        console.log(`Owner: ${jettonData.owner.toString()}`);

        // Get sender information
        const senderAddress = provider.sender().address;
        if (!senderAddress) {
            console.log('❌ Sender address not available');
            return;
        }

        console.log('\n👤 Sender Information:');
        console.log(`Sender: ${senderAddress.toString()}`);

        // Get sender's wallet address
        const senderWallet = await token.getGetWalletAddress(senderAddress);
        console.log(`Sender Wallet: ${senderWallet.toString()}`);

        // Check if sender is excluded from transaction limits
        const isExcluded = await token.getIsExcludedAddress(senderAddress);
        console.log(`Excluded from Limits: ${isExcluded}`);

        // Get current transaction limit
        const transactionLimit = await token.getGetTransactionLimit();
        console.log(`Transaction Limit: ${(Number(transactionLimit) / 1e9).toFixed(2)} ${symbol}`);

        console.log('\n💳 Wallet Operations Available:');
        console.log('='.repeat(40));

        // Example recipient address (using owner address from config or fallback)
        const recipientAddress = getOwnerAddress() || Address.parse("EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG");
        const recipientWallet = await token.getGetWalletAddress(recipientAddress);

        console.log('\n🎯 Transfer Example:');
        console.log(`Recipient: ${recipientAddress.toString()}`);
        console.log(`Recipient Wallet: ${recipientWallet.toString()}`);

        // Note: Direct token transfers require interacting with the wallet contract
        // This script demonstrates how to prepare transfer parameters

        const transferAmount = toNano('100'); // 100 RTZ tokens
        const forwardAmount = toNano('0.01'); // Amount to forward to recipient
        const queryId = BigInt(Math.floor(Date.now() / 1000));

        console.log('\n📋 Transfer Parameters:');
        console.log(`Amount: ${(Number(transferAmount) / 1e9).toFixed(2)} ${symbol}`);
        console.log(`Forward Amount: ${(Number(forwardAmount) / 1e9).toFixed(9)} TON`);
        console.log(`Query ID: ${queryId}`);

        // Check transaction limit compliance
        if (!isExcluded && transferAmount > transactionLimit) {
            console.log('\n⚠️ Transfer Amount Exceeds Limit!');
            console.log(`Transfer: ${(Number(transferAmount) / 1e9).toFixed(2)} ${symbol}`);
            console.log(`Limit: ${(Number(transactionLimit) / 1e9).toFixed(2)} ${symbol}`);
            console.log('Transfer would be rejected by the contract');
        } else {
            console.log('\n✅ Transfer Amount Within Limits');
        }

        console.log('\n🔧 Wallet Contract Information:');
        console.log('• Wallet contracts handle token transfers');
        console.log('• Each user has a unique wallet contract');
        console.log('• Transfers are validated against transaction limits');
        console.log('• Excluded addresses can bypass limits');

        console.log('\n📝 Transfer Process:');
        console.log('1. Send TokenTransfer message to sender\'s wallet');
        console.log('2. Wallet validates transaction limits');
        console.log('3. Wallet sends TokenTransferInternal to recipient wallet');
        console.log('4. Recipient wallet updates balance');
        console.log('5. Notifications sent to relevant parties');

        console.log('\n💡 Gas Estimation:');
        console.log('• Wallet operations require sufficient TON for gas');
        console.log('• Typical transfer: 0.05-0.1 TON');
        console.log('• Forward amount: additional TON for recipient notification');
        console.log('• Complex transfers may require more gas');

        console.log('\n🎯 Example Wallet Addresses:');
        const exampleAddresses = [
            jettonData.owner.toString(),
            recipientAddress.toString(),
            senderAddress.toString()
        ];

        for (const addr of exampleAddresses) {
            try {
                const address = Address.parse(addr);
                const walletAddr = await token.getGetWalletAddress(address);
                const excluded = await token.getIsExcludedAddress(address);
                console.log(`${addr.slice(0, 10)}...${addr.slice(-6)}:`);
                console.log(`  Wallet: ${walletAddr.toString()}`);
                console.log(`  Excluded: ${excluded}`);
            } catch (e) {
                console.log(`${addr}: Error getting wallet info`);
            }
        }

        console.log('\n⚠️ Important Notes:');
        console.log('• This script shows wallet information and transfer preparation');
        console.log('• Actual transfers require wallet contract interaction');
        console.log('• Use TON wallet apps for user-friendly transfers');
        console.log('• Always check transaction limits before transfers');

    } catch (error) {
        console.error('❌ Error in wallet operations:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('• Verify contract address is correct');
        console.log('• Check network connectivity');
        console.log('• Ensure sufficient gas for operations');
        console.log('• Verify address formats are correct');
    }
}