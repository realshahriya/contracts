import { Address, toNano } from '@ton/core';
import { RezaToken } from '../wrappers/RezaToken';
import { NetworkProvider } from '@ton/blueprint';
import { extractMetadata, formatTokenAmount } from '../utils/metadata-helpers';
import { getContractAddress, validateConfig, getDefaultGas, getOwnerAddress } from './config';

export async function run(provider: NetworkProvider) {
    console.log('⚖️ Dynamic Transaction Limits Management - RTZ Token');
    console.log('='.repeat(55));
    console.log('🔄 Daily adjustable limits with no hardcoded restrictions');
    console.log('💡 Owner can modify transaction limits anytime');

    // Validate configuration and get contract address
    validateConfig();
    const contractAddress = getContractAddress();
    const token = provider.open(RezaToken.fromAddress(contractAddress));

    try {
        // Get current contract state
        console.log('\n📊 Current Contract State:');
        const jettonData = await token.getGetJettonData();
        const metadata = extractMetadata(jettonData.content);
        
        console.log(`Token: ${metadata.name} (${metadata.symbol})`);
        console.log(`Owner: ${jettonData.owner.toString()}`);
        
        // Get current transaction limits
        try {
            const currentTxLimit = await token.getGetMaxTxAmount();
            const currentWalletLimit = await token.getGetMaxWalletAmount();
            const limitsEnabled = await token.getGetLimitsEnabled();
            
            const txLimitDisplay = currentTxLimit === BigInt(0) ? 'UNLIMITED' : formatTokenAmount(currentTxLimit, metadata.decimals, metadata.symbol);
            const walletLimitDisplay = currentWalletLimit === BigInt(0) ? 'UNLIMITED' : formatTokenAmount(currentWalletLimit, metadata.decimals, metadata.symbol);
            
            console.log(`Transaction Limit: ${txLimitDisplay}`);
            console.log(`Wallet Limit: ${walletLimitDisplay}`);
            console.log(`Limits Enabled: ${limitsEnabled ? '✅ Yes' : '❌ No'}`);
        } catch (error) {
            console.log('Transaction Limits: ⚠️ Could not retrieve current limits');
        }

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
            console.log('You can still view current limits and settings');
        }

        // Interactive menu for transaction limits management
        if (isOwner) {
            console.log('\n🎯 Dynamic Transaction Limits Management Options:');
            console.log('='.repeat(45));
            console.log('1. 📊 Set daily transaction limits (recommended for daily changes)');
            console.log('2. 🔄 Enable/disable limits enforcement');
            console.log('3. 📋 View current settings and status');
            console.log('4. 🚫 Manage address exclusions');
            console.log('5. 👋 Exit');

            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const option = await new Promise<string>((resolve) => {
                readline.question('\n🔢 Select option (1-5): ', resolve);
            });

            switch (option) {
                case '1':
                    await setTransactionLimit(provider, token, readline, metadata);
                    break;
                case '2':
                    await toggleLimitsEnabled(provider, token, readline);
                    break;
                case '3':
                    await viewCurrentSettings(token, metadata);
                    break;
                case '4':
                    await manageAddressExclusions(provider, token, readline);
                    break;
                case '5':
                    console.log('👋 Goodbye!');
                    break;
                default:
                    console.log('❌ Invalid option selected');
            }

            readline.close();
        } else {
            // Non-owner can only view settings
            await viewCurrentSettings(token, metadata);
        }

    } catch (error) {
        console.error('❌ Error in transaction limits management:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('• Verify you are the contract owner');
        console.log('• Check contract address is correct');
        console.log('• Ensure sufficient gas for transactions');
        console.log('• Verify network connectivity');
    }
}

async function setTransactionLimit(provider: NetworkProvider, token: any, readline: any, metadata: any) {
    console.log('\n🔧 Set Daily Transaction Limit');
    console.log('='.repeat(35));
    console.log('💡 Perfect for daily limit adjustments');
    console.log('🚀 No wallet limits - users can hold unlimited amounts');
    console.log('⚡ Enter 0 for unlimited transaction amounts');

    const limitInput = await new Promise<string>((resolve) => {
        readline.question(`Enter new transaction limit (in ${metadata.symbol}, 0 for unlimited): `, resolve);
    });

    const limitAmount = parseFloat(limitInput);
    if (isNaN(limitAmount) || limitAmount < 0) {
        console.log('❌ Invalid limit amount (must be 0 or positive)');
        return;
    }

    const limitInNano = limitAmount === 0 ? BigInt(0) : BigInt(Math.floor(limitAmount * Math.pow(10, metadata.decimals)));

    console.log(`\n📋 New Limit Details:`);
    if (limitAmount === 0) {
        console.log(`Amount: UNLIMITED (no transaction limits)`);
        console.log(`Amount (nano): 0 (unlimited)`);
    } else {
        console.log(`Amount: ${limitAmount} ${metadata.symbol}`);
        console.log(`Amount (nano): ${limitInNano.toString()}`);
    }

    // No wallet limits - set to 0 (unlimited) by design
    const walletLimitInNano = BigInt(0);

    console.log(`\n📋 Daily Limit Configuration:`);
    console.log(`Transaction Limit: ${limitAmount === 0 ? 'UNLIMITED' : limitAmount + ' ' + metadata.symbol}`);
    console.log(`Wallet Limit: UNLIMITED (no restrictions on holdings)`);
    console.log(`🔄 This limit can be changed daily as needed`);

    const confirm = await new Promise<string>((resolve) => {
        readline.question('\n❓ Confirm setting new limits? (yes/no): ', resolve);
    });

    if (confirm.toLowerCase() !== 'yes') {
        console.log('❌ Operation cancelled');
        return;
    }

    try {
        console.log('\n🚀 Setting new transaction limits...');
        await token.send(
            provider.sender(),
            { value: getDefaultGas() },
            {
                $$type: 'SetTransactionLimit',
                maxTxAmount: limitInNano,
                maxWalletAmount: walletLimitInNano
            }
        );

        console.log('✅ Daily transaction limit update sent successfully!');
        console.log('⏳ Please wait for transaction confirmation...');
        console.log('🔄 You can change this limit again tomorrow or anytime needed');
        
        if (limitAmount === 0) {
            console.log('🎉 Unlimited transaction amounts set for today!');
        } else {
            console.log(`🎉 Daily transaction limit set to ${limitAmount} ${metadata.symbol}!`);
        }
        console.log('💎 Wallet holdings remain unlimited (no restrictions)');
    } catch (error) {
        console.error('❌ Error setting transaction limit:', error);
    }
}

async function toggleLimitsEnabled(provider: NetworkProvider, token: any, readline: any) {
    console.log('\n🔄 Toggle Limits Enabled/Disabled');
    console.log('='.repeat(30));

    try {
        const currentStatus = await token.getGetLimitsEnabled();
        console.log(`Current Status: ${currentStatus ? 'Enabled' : 'Disabled'}`);
        
        const newStatus = !currentStatus;
        console.log(`New Status: ${newStatus ? 'Enabled' : 'Disabled'}`);

        const confirm = await new Promise<string>((resolve) => {
            readline.question(`\n❓ ${newStatus ? 'Enable' : 'Disable'} transaction limits? (yes/no): `, resolve);
        });

        if (confirm.toLowerCase() !== 'yes') {
            console.log('❌ Operation cancelled');
            return;
        }

        console.log(`\n🚀 ${newStatus ? 'Enabling' : 'Disabling'} transaction limits...`);
        await token.send(
            provider.sender(),
            { value: getDefaultGas() },
            {
                $$type: 'SetLimitsEnabled',
                enabled: newStatus
            }
        );

        console.log('✅ Limits status update sent successfully!');
        console.log('⏳ Please wait for transaction confirmation...');
    } catch (error) {
        console.error('❌ Error toggling limits:', error);
    }
}

async function viewCurrentSettings(token: any, metadata: any) {
    console.log('\n📊 Current Dynamic Transaction Limit Settings');
    console.log('='.repeat(45));
    console.log('🔄 These limits can be changed daily by the owner');

    try {
        const currentTxLimit = await token.getGetMaxTxAmount();
        const currentWalletLimit = await token.getGetMaxWalletAmount();
        const limitsEnabled = await token.getGetLimitsEnabled();

        // Format limits with zero handling
        const txLimitDisplay = currentTxLimit === BigInt(0) ? 'UNLIMITED' : formatTokenAmount(currentTxLimit, metadata.decimals, metadata.symbol);
        const walletLimitDisplay = currentWalletLimit === BigInt(0) ? 'UNLIMITED' : formatTokenAmount(currentWalletLimit, metadata.decimals, metadata.symbol);

        console.log(`Transaction Limit: ${txLimitDisplay}`);
        console.log(`Wallet Limit: ${walletLimitDisplay}`);
        console.log(`Limits Enabled: ${limitsEnabled ? '✅ Yes' : '❌ No'}`);

        if (limitsEnabled) {
            console.log('\n💡 Current Status: Dynamic transaction limits are active');
            
            if (currentTxLimit === BigInt(0)) {
                console.log('• 🎉 UNLIMITED transaction amounts (no daily limit set)');
            } else {
                console.log(`• 📊 Daily transaction limit: ${txLimitDisplay}`);
            }
            
            console.log('• 💎 Wallet holdings: UNLIMITED (no restrictions by design)');
            console.log('• 🔄 Transaction limits can be changed daily by owner');
            console.log('• 🚫 Limits apply to all transfers except excluded addresses');
            console.log('• 👑 Owner is automatically excluded from all limits');
        } else {
            console.log('\n💡 Current Status: Transaction limits are disabled');
            console.log('• 🎉 All transfers are allowed regardless of amount');
            console.log('• 💎 Wallet holdings are always unlimited');
            console.log('• 🔄 Daily limit values are set but not enforced');
            console.log('• ⚡ Enable limits to activate daily enforcement');
        }
    } catch (error) {
        console.error('❌ Error retrieving current settings:', error);
    }
}

async function manageAddressExclusions(provider: NetworkProvider, token: any, readline: any) {
    console.log('\n🚫 Manage Address Exclusions');
    console.log('='.repeat(30));

    console.log('1. Add address to exclusions');
    console.log('2. Remove address from exclusions');
    console.log('3. Check if address is excluded');

    const option = await new Promise<string>((resolve) => {
        readline.question('\nSelect option (1-3): ', resolve);
    });

    const addressInput = await new Promise<string>((resolve) => {
        readline.question('Enter address: ', resolve);
    });

    try {
        const address = Address.parse(addressInput);

        switch (option) {
            case '1':
                console.log('\n🚀 Adding address to exclusions...');
                await token.send(
                    provider.sender(),
                    { value: getDefaultGas() },
                    {
                        $$type: 'SetExcludedFromLimits',
                        address: address,
                        excluded: true
                    }
                );
                console.log('✅ Address exclusion update sent!');
                break;

            case '2':
                console.log('\n🚀 Removing address from exclusions...');
                await token.send(
                    provider.sender(),
                    { value: getDefaultGas() },
                    {
                        $$type: 'SetExcludedFromLimits',
                        address: address,
                        excluded: false
                    }
                );
                console.log('✅ Address exclusion removal sent!');
                break;

            case '3':
                const isExcluded = await token.getIsExcludedFromLimits(address);
                console.log(`\n📋 Address Status:`);
                console.log(`Address: ${address.toString()}`);
                console.log(`Excluded from limits: ${isExcluded ? '✅ Yes' : '❌ No'}`);
                break;

            default:
                console.log('❌ Invalid option');
        }
    } catch (error) {
        console.error('❌ Error managing address exclusions:', error);
    }
}
