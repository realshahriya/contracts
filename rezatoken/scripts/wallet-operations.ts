import { Address, toNano, beginCell } from '@ton/core';
import { RezaToken } from '../wrappers/RezaToken';
import { NetworkProvider } from '@ton/blueprint';
import { getContractAddress, getOwnerAddress, validateConfig } from './config';
import { extractMetadata, formatTokenAmount } from '../utils/metadata-helpers';

export async function run(provider: NetworkProvider) {
    console.log('💳 Wallet Operations Script');
    console.log('='.repeat(50));

    // Validate configuration and get contract address
    validateConfig();
    const contractAddress = getContractAddress();
    const token = provider.open(RezaToken.fromAddress(contractAddress));

    try {
        // Get current contract state
        console.log('\n📊 Contract Information:');
        const jettonData = await token.getGetJettonData();
        const metadata = extractMetadata(jettonData.content);
        console.log(`Token: ${metadata.name} (${metadata.symbol})`);
        console.log(`Total Supply: ${formatTokenAmount(jettonData.totalSupply, metadata.decimals, metadata.symbol)}`);
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

        // Check transaction limits and exclusions
        try {
            const transactionLimit = await token.getGetMaxTxAmount();
            const limitsEnabled = await token.getGetLimitsEnabled();
            const isExcluded = await token.getIsExcludedFromLimits(senderAddress);
            
            console.log(`Transaction Limit: ${limitsEnabled ? formatTokenAmount(transactionLimit, metadata.decimals, metadata.symbol) : 'Disabled'}`);
            console.log(`Excluded from Limits: ${isExcluded ? '✅ Yes' : '❌ No'}`);
        } catch (error) {
            console.log('Transaction Limit: Error retrieving limit info');
            console.log('Excluded from Limits: Error retrieving exclusion info');
        }

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
        console.log(`Amount: ${(Number(transferAmount) / 1e9).toFixed(2)} ${metadata.symbol}`);
        console.log(`Forward Amount: ${(Number(forwardAmount) / 1e9).toFixed(9)} TON`);
        console.log(`Query ID: ${queryId}`);

        console.log('\n✅ Transfer (Subject to Transaction Limits)');

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
                console.log(`${addr.slice(0, 10)}...${addr.slice(-6)}:`);
                console.log(`  Wallet: ${walletAddr.toString()}`);
                try {
                    const isExcluded = await token.getIsExcludedFromLimits(address);
                    console.log(`  Excluded: ${isExcluded ? '✅ Yes' : '❌ No'}`);
                } catch (e) {
                    console.log(`  Excluded: Error checking exclusion status`);
                }
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
