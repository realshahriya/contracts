import { Address, toNano } from '@ton/core';
import { Token } from '../wrappers/token';
import { NetworkProvider } from '@ton/blueprint';
import { getContractAddress, getDefaultGas, validateConfig } from './config';

export async function run(provider: NetworkProvider) {
    console.log('⚖️ Transaction Limits Management Script');
    console.log('='.repeat(50));

    // Validate configuration and get contract address
    validateConfig();
    const contractAddress = getContractAddress();
    const token = provider.open(Token.fromAddress(contractAddress));

    try {
        // Get current contract state
        console.log('\n📊 Current Contract State:');
        const jettonData = await token.getGetJettonData();
        const symbol = await token.getGetSymbol();
        const currentLimit = await token.getGetTransactionLimit();
        
        console.log(`Token: ${await token.getGetName()} (${symbol})`);
        console.log(`Owner: ${jettonData.owner.toString()}`);
        console.log(`Current Transaction Limit: ${(Number(currentLimit) / 1e9).toFixed(2)} ${symbol}`);

        // Check if sender is the owner
        const senderAddress = provider.sender().address;
        if (!senderAddress) {
            console.log('❌ Sender address not available');
            return;
        }

        const isOwner = senderAddress.equals(jettonData.owner);
        console.log(`\n👤 Sender: ${senderAddress.toString()}`);
        console.log(`Is Owner: ${isOwner ? '✅ Yes' : '❌ No'}`);

        if (!isOwner) {
            console.log('\n⚠️ Only the contract owner can modify transaction limits');
            console.log('This script will demonstrate the process but cannot execute changes');
        }

        // Demonstrate different limit scenarios
        console.log('\n🎯 Transaction Limit Scenarios:');
        console.log('='.repeat(40));

        const limitScenarios = [
            { name: 'Conservative', amount: toNano('1000'), description: 'Low limit for security' },
            { name: 'Moderate', amount: toNano('10000'), description: 'Balanced limit for normal use' },
            { name: 'Liberal', amount: toNano('100000'), description: 'High limit for power users' },
            { name: 'No Limit', amount: toNano('1000000000'), description: 'Effectively unlimited' }
        ];

        for (const scenario of limitScenarios) {
            console.log(`\n${scenario.name} Limit:`);
            console.log(`  Amount: ${(Number(scenario.amount) / 1e9).toFixed(0)} ${symbol}`);
            console.log(`  Description: ${scenario.description}`);
            console.log(`  Current: ${scenario.amount === currentLimit ? '✅ Active' : '⚪ Inactive'}`);
        }

        // Example: Set new transaction limit
        const newLimit = toNano('50000'); // 50,000 RTZ tokens
        console.log(`\n🔧 Setting New Transaction Limit:`);
        console.log(`New Limit: ${(Number(newLimit) / 1e9).toFixed(0)} ${symbol}`);

        if (isOwner) {
            console.log('\n📤 Sending SetTransactionLimit message...');
            
            const result = await token.send(
                provider.sender(),
                {
                    value: getDefaultGas(), // Gas fee from config
                },
                {
                    $$type: 'SetTransactionLimit',
                    limit: newLimit
                }
            );

            console.log('✅ Transaction sent');

            // Wait a bit for the transaction to be processed
            console.log('\n⏳ Waiting for transaction confirmation...');
            await new Promise(resolve => setTimeout(resolve, 10000));

            // Check updated limit
            const updatedLimit = await token.getGetTransactionLimit();
            console.log(`\n📊 Updated Transaction Limit: ${(Number(updatedLimit) / 1e9).toFixed(2)} ${symbol}`);
            
            if (updatedLimit === newLimit) {
                console.log('✅ Transaction limit updated successfully!');
            } else {
                console.log('⚠️ Transaction limit may still be updating...');
            }
        } else {
            console.log('\n🔒 Owner-only operation - simulation mode');
            console.log('Message structure that would be sent:');
            console.log(JSON.stringify({
                $$type: 'SetTransactionLimit',
                limit: newLimit.toString()
            }, null, 2));
        }

        // Check transaction limit for various addresses
        console.log('\n🔍 Address Limit Compliance Check:');
        console.log('='.repeat(40));

        const testAddresses = [
            jettonData.owner.toString(),
            "EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG",
            senderAddress.toString()
        ];

        for (const addr of testAddresses) {
            try {
                const address = Address.parse(addr);
                const isExcluded = await token.getIsExcludedAddress(address);
                const walletAddr = await token.getGetWalletAddress(address);
                
                console.log(`\n📍 ${addr.slice(0, 10)}...${addr.slice(-6)}:`);
                console.log(`  Wallet: ${walletAddr.toString().slice(0, 10)}...${walletAddr.toString().slice(-6)}`);
                console.log(`  Excluded from Limits: ${isExcluded ? '✅ Yes' : '❌ No'}`);
                console.log(`  Max Transfer: ${isExcluded ? 'Unlimited' : `${(Number(currentLimit) / 1e9).toFixed(0)} ${symbol}`}`);
            } catch (e) {
                console.log(`${addr}: Error checking address`);
            }
        }

        // Demonstrate limit checking
        console.log('\n🧮 Transfer Amount Validation:');
        console.log('='.repeat(40));

        const testAmounts = [
            toNano('100'),
            toNano('1000'),
            toNano('10000'),
            toNano('100000')
        ];

        for (const amount of testAmounts) {
            const amountFormatted = (Number(amount) / 1e9).toFixed(0);
            const withinLimit = amount <= currentLimit;
            console.log(`${amountFormatted} ${symbol}: ${withinLimit ? '✅ Allowed' : '❌ Exceeds Limit'}`);
        }

        console.log('\n💡 Transaction Limit Best Practices:');
        console.log('• Set limits based on token economics');
        console.log('• Consider user experience vs security');
        console.log('• Use address exclusions for trusted parties');
        console.log('• Monitor and adjust limits as needed');
        console.log('• Document limit changes for transparency');

        console.log('\n⚠️ Important Notes:');
        console.log('• Only contract owner can modify limits');
        console.log('• Excluded addresses bypass all limits');
        console.log('• Limits apply to individual transfers');
        console.log('• Changes take effect immediately');
        console.log('• Gas fee required for limit updates');

    } catch (error) {
        console.error('❌ Error in transaction limits management:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('• Verify you are the contract owner');
        console.log('• Check contract address is correct');
        console.log('• Ensure sufficient gas for transactions');
        console.log('• Verify network connectivity');
    }
}