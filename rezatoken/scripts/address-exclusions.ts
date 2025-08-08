import { Address, toNano } from '@ton/core';
import { Token } from '../wrappers/token';
import { NetworkProvider } from '@ton/blueprint';
import { getContractAddress, getDefaultGas, getOwnerAddress, validateConfig } from './config';

export async function run(provider: NetworkProvider) {
    console.log('🏷️ Address Exclusions Management Script');
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
        const transactionLimit = await token.getGetTransactionLimit();
        
        console.log(`Token: ${await token.getGetName()} (${symbol})`);
        console.log(`Owner: ${jettonData.owner.toString()}`);
        console.log(`Transaction Limit: ${(Number(transactionLimit) / 1e9).toFixed(2)} ${symbol}`);

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
            console.log('\n⚠️ Only the contract owner can manage address exclusions');
            console.log('This script will demonstrate the process but cannot execute changes');
        }

        // Check current exclusion status of various addresses
        console.log('\n🔍 Current Exclusion Status:');
        console.log('='.repeat(40));

        const testAddresses = [
            jettonData.owner.toString(), // Owner should typically be excluded
            "EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG", // Example address
            "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c", // Burn address
            senderAddress.toString()
        ];

        const addressLabels = [
            "Contract Owner",
            "Example Address",
            "Burn Address",
            "Current Sender"
        ];

        for (let i = 0; i < testAddresses.length; i++) {
            try {
                const address = Address.parse(testAddresses[i]);
                const isExcluded = await token.getIsExcludedAddress(address);
                const walletAddr = await token.getGetWalletAddress(address);
                
                console.log(`\n📍 ${addressLabels[i]}:`);
                console.log(`  Address: ${testAddresses[i]}`);
                console.log(`  Wallet: ${walletAddr.toString()}`);
                console.log(`  Excluded: ${isExcluded ? '✅ Yes' : '❌ No'}`);
                console.log(`  Transfer Limit: ${isExcluded ? 'Unlimited' : `${(Number(transactionLimit) / 1e9).toFixed(0)} ${symbol}`}`);
            } catch (e) {
                console.log(`${addressLabels[i]}: Error checking address`);
            }
        }

        // Example: Add address to exclusion list
        const addressToExclude = getOwnerAddress() || Address.parse("EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG"); // Using owner address from config or fallback
        console.log(`\n➕ Adding Address to Exclusion List:`);
        console.log(`Address: ${addressToExclude.toString()}`);

        if (isOwner) {
            console.log('\n📤 Sending AddExcludedAddress message...');
            
            const addResult = await token.send(
                provider.sender(),
                {
                    value: getDefaultGas(), // Gas fee from config
                },
                {
                    $$type: 'AddExcludedAddress',
                    address: addressToExclude
                }
            );

            console.log('✅ Add exclusion transaction sent!');

            // Wait for transaction confirmation
            console.log('\n⏳ Waiting for transaction confirmation...');
            await new Promise(resolve => setTimeout(resolve, 10000));

            // Check updated exclusion status
            const isNowExcluded = await token.getIsExcludedAddress(addressToExclude);
            console.log(`\n📊 Updated Exclusion Status: ${isNowExcluded ? '✅ Excluded' : '❌ Not Excluded'}`);
            
            if (isNowExcluded) {
                console.log('✅ Address successfully added to exclusion list!');
            } else {
                console.log('⚠️ Exclusion status may still be updating...');
            }

            // Example: Remove address from exclusion list
            console.log(`\n➖ Removing Address from Exclusion List:`);
            console.log(`Address: ${addressToExclude.toString()}`);

            console.log('\n📤 Sending RemoveExcludedAddress message...');
            
            const removeResult = await token.send(
                provider.sender(),
                {
                    value: getDefaultGas(), // Gas fee from config
                },
                {
                    $$type: 'RemoveExcludedAddress',
                    address: addressToExclude
                }
            );

            console.log('✅ Remove exclusion transaction sent!');

            // Wait for transaction confirmation
            console.log('\n⏳ Waiting for transaction confirmation...');
            await new Promise(resolve => setTimeout(resolve, 10000));

            // Check final exclusion status
            const isFinallyExcluded = await token.getIsExcludedAddress(addressToExclude);
            console.log(`\n📊 Final Exclusion Status: ${isFinallyExcluded ? '✅ Excluded' : '❌ Not Excluded'}`);
            
            if (!isFinallyExcluded) {
                console.log('✅ Address successfully removed from exclusion list!');
            } else {
                console.log('⚠️ Exclusion status may still be updating...');
            }

        } else {
            console.log('\n🔒 Owner-only operation - simulation mode');
            console.log('Add exclusion message structure:');
            console.log(JSON.stringify({
                $$type: 'AddExcludedAddress',
                address: addressToExclude.toString()
            }, null, 2));

            console.log('\nRemove exclusion message structure:');
            console.log(JSON.stringify({
                $$type: 'RemoveExcludedAddress',
                address: addressToExclude.toString()
            }, null, 2));
        }

        // Demonstrate exclusion use cases
        console.log('\n🎯 Common Exclusion Use Cases:');
        console.log('='.repeat(40));

        const useCases = [
            {
                type: "Contract Owner",
                reason: "Administrative operations without limits",
                example: jettonData.owner.toString()
            },
            {
                type: "DEX Contracts",
                reason: "Large trading volumes",
                example: "EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG"
            },
            {
                type: "Bridge Contracts",
                reason: "Cross-chain transfers",
                example: "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"
            },
            {
                type: "Treasury Wallets",
                reason: "Large institutional transfers",
                example: "EQD4FPq-aQiCeldHFflo_VWJyUGsHx7ntbvvLT5YW7Oe_-Hi"
            }
        ];

        for (const useCase of useCases) {
            console.log(`\n${useCase.type}:`);
            console.log(`  Reason: ${useCase.reason}`);
            console.log(`  Example: ${useCase.example.slice(0, 10)}...${useCase.example.slice(-6)}`);
        }

        // Show exclusion impact on transfers
        console.log('\n💰 Transfer Impact Analysis:');
        console.log('='.repeat(40));

        const transferAmounts = [
            toNano('1000'),
            toNano('10000'),
            toNano('100000'),
            toNano('1000000')
        ];

        console.log('Transfer amounts vs limits:');
        for (const amount of transferAmounts) {
            const amountFormatted = (Number(amount) / 1e9).toFixed(0);
            const withinLimit = amount <= transactionLimit;
            console.log(`${amountFormatted} ${symbol}:`);
            console.log(`  Regular Address: ${withinLimit ? '✅ Allowed' : '❌ Blocked'}`);
            console.log(`  Excluded Address: ✅ Always Allowed`);
        }

        console.log('\n💡 Exclusion Management Best Practices:');
        console.log('• Exclude only trusted addresses');
        console.log('• Document exclusion reasons');
        console.log('• Regularly review exclusion list');
        console.log('• Remove exclusions when no longer needed');
        console.log('• Monitor excluded address activity');

        console.log('\n⚠️ Security Considerations:');
        console.log('• Excluded addresses bypass ALL limits');
        console.log('• Compromised excluded addresses are high risk');
        console.log('• Use multi-sig for exclusion management');
        console.log('• Implement time-based exclusions if needed');
        console.log('• Log all exclusion changes');

        console.log('\n📋 Exclusion Checklist:');
        console.log('✓ Verify address is legitimate');
        console.log('✓ Confirm exclusion necessity');
        console.log('✓ Document business justification');
        console.log('✓ Set monitoring alerts');
        console.log('✓ Plan regular reviews');

    } catch (error) {
        console.error('❌ Error in address exclusions management:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('• Verify you are the contract owner');
        console.log('• Check contract address is correct');
        console.log('• Ensure sufficient gas for transactions');
        console.log('• Verify address format is correct');
        console.log('• Check network connectivity');
    }
}