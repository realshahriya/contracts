import { toNano, Address } from '@ton/core';
import { RezaToken } from '../wrappers/RezaToken';
import { NetworkProvider } from '@ton/blueprint';
import { getContractAddress, validateConfig, getDefaultGas } from './config';
import { extractMetadata, formatTokenAmount } from '../utils/metadata-helpers';

export async function run(provider: NetworkProvider) {
    console.log('🚦 Enabling Transaction Limits - RTZ Token');
    console.log('='.repeat(50));

    // Validate configuration and get contract address
    validateConfig();
    const contractAddress = getContractAddress();
    const rezaToken = provider.open(RezaToken.fromAddress(contractAddress));

    try {
        // Get current state
        const jettonData = await rezaToken.getGetJettonData();
        const metadata = extractMetadata(jettonData.content);
        const limitsEnabled = await rezaToken.getGetLimitsEnabled();
        
        console.log(`Token: ${metadata.name} (${metadata.symbol})`);
        console.log('Current limits enabled:', limitsEnabled ? '✅ Yes' : '❌ No');
        console.log('Contract owner:', jettonData.owner.toString());

        if (!limitsEnabled) {
            console.log('\n🚀 Enabling transaction limits...');
            
            await rezaToken.send(
                provider.sender(),
                {
                    value: getDefaultGas(),
                    bounce: false,
                },
                {
                    $$type: 'SetLimitsEnabled',
                    enabled: true,
                }
            );

            console.log('✅ Transaction sent to enable limits!');
            console.log('⏳ Waiting for confirmation...');
            
            // Wait a bit for the transaction to process
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Check updated state
            const updatedLimitsEnabled = await rezaToken.getGetLimitsEnabled();
            console.log('Updated limits enabled:', updatedLimitsEnabled ? '✅ Yes' : '❌ No');
        } else {
            console.log('\n✅ Limits are already enabled!');
        }

        // Show current limits with zero handling
        const maxTxAmount = await rezaToken.getGetMaxTxAmount();
        const maxWalletAmount = await rezaToken.getGetMaxWalletAmount();
        
        console.log('\n📊 Current Transaction Limits:');
        
        const txLimitDisplay = maxTxAmount === BigInt(0) ? 'UNLIMITED' : formatTokenAmount(maxTxAmount, metadata.decimals, metadata.symbol);
        const walletLimitDisplay = maxWalletAmount === BigInt(0) ? 'UNLIMITED' : formatTokenAmount(maxWalletAmount, metadata.decimals, metadata.symbol);
        
        console.log(`Max Transaction: ${txLimitDisplay}`);
        console.log(`Max Wallet: ${walletLimitDisplay}`);
        
        if (maxTxAmount === BigInt(0) && maxWalletAmount === BigInt(0)) {
            console.log('\n🎉 NO LIMITS SET - Unlimited transfers enabled!');
            console.log('💡 Use the transaction-limits script to set specific limits');
        } else if (maxTxAmount === BigInt(0)) {
            console.log('\n🎉 Unlimited transaction amounts!');
        } else if (maxWalletAmount === BigInt(0)) {
            console.log('\n🎉 Unlimited wallet holdings!');
        }
        
        console.log('\n✅ Transaction limits are now active!');
        console.log('🔧 The wallet contract will dynamically enforce these limits on all transfers.');
        console.log('👑 Owner is automatically excluded from all limits.');
        
    } catch (error) {
        console.error('❌ Error enabling limits:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('• Verify you are the contract owner');
        console.log('• Check contract address is correct');
        console.log('• Ensure sufficient gas for transactions');
    }
}