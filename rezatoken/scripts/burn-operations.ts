import { toNano } from '@ton/core';
import { RezaToken } from '../wrappers/RezaToken';
import { NetworkProvider } from '@ton/blueprint';
import { getContractAddress, validateConfig } from './config';
import { extractMetadata, formatTokenAmount } from '../utils/metadata-helpers';

export async function run(provider: NetworkProvider) {
    console.log('🔥 Burn Operations Script');
    console.log('='.repeat(50));

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
        console.log(`Total Supply: ${formatTokenAmount(jettonData.totalSupply, metadata.decimals)} ${metadata.symbol}`);
        console.log(`Owner: ${jettonData.owner.toString()}`);

        // Get sender information
        const senderAddress = provider.sender().address;
        if (!senderAddress) {
            console.log('❌ Sender address not available');
            return;
        }

        console.log(`\n👤 Sender: ${senderAddress.toString()}`);

        // Get sender's wallet address
        const senderWallet = await token.getGetWalletAddress(senderAddress);
        console.log(`Sender Wallet: ${senderWallet.toString()}`);

        // Check transaction limits and exclusions
        try {
            const transactionLimit = await token.getGetMaxTxAmount();
            const limitsEnabled = await token.getGetLimitsEnabled();
            const isExcluded = await token.getIsExcludedFromLimits(senderAddress);
            
            console.log(`Transaction Limit: ${limitsEnabled ? formatTokenAmount(transactionLimit, metadata.decimals, metadata.symbol) : 'Disabled'}`);
            console.log(`Address Exclusions: ${isExcluded ? '✅ Excluded' : '❌ Not Excluded'}`);
        } catch (error) {
            console.log('Transaction Limit: Error retrieving limit info');
            console.log('Address Exclusions: Error retrieving exclusion info');
        }

        console.log('\n🔥 Burn Operations Overview:');
        console.log('='.repeat(40));
        console.log('• Token burning permanently removes tokens from circulation');
        console.log('• Burned tokens reduce the total supply');
        console.log('• Burn operations are irreversible');
        console.log('• Users can burn their own tokens');
        console.log('• Burn amounts are subject to transaction limits (unless excluded)');

        // Demonstrate burn scenarios
        console.log('\n🎯 Burn Scenarios:');
        console.log('='.repeat(40));

        const burnScenarios = [
            { name: 'Small Burn', amount: toNano('100'), description: 'Minimal token burn' },
            { name: 'Medium Burn', amount: toNano('1000'), description: 'Moderate token burn' },
            { name: 'Large Burn', amount: toNano('10000'), description: 'Significant token burn' },
            { name: 'Very Large Burn', amount: toNano('100000'), description: 'Major token burn' }
        ];

        for (const scenario of burnScenarios) {
            const amountFormatted = formatTokenAmount(scenario.amount, metadata.decimals);
            
            console.log(`\n${scenario.name}:`);
            console.log(`  Amount: ${amountFormatted} ${metadata.symbol}`);
            console.log(`  Description: ${scenario.description}`);
            
            // Check if this amount would be allowed based on transaction limits
            try {
                const transactionLimit = await token.getGetMaxTxAmount();
                const limitsEnabled = await token.getGetLimitsEnabled();
                const isExcluded = await token.getIsExcludedFromLimits(senderAddress);
                
                const allowed = !limitsEnabled || isExcluded || scenario.amount <= transactionLimit;
                console.log(`  Allowed: ${allowed ? '✅ Yes' : '❌ No (exceeds transaction limit)'}`);
            } catch (error) {
                console.log(`  Allowed: ⚠️ Unable to check limits`);
            }
            
            console.log(`  Impact: -${((Number(scenario.amount) / Number(jettonData.totalSupply)) * 100).toFixed(4)}% of total supply`);
        }

        // Example burn operation
        const burnAmount = toNano('500'); // 500 RTZ tokens
        console.log(`\n🔥 Example Burn Operation:`);
        console.log(`Burn Amount: ${formatTokenAmount(burnAmount, metadata.decimals)} ${metadata.symbol}`);
        
        // Check if example burn is within limits
        try {
            const transactionLimit = await token.getGetMaxTxAmount();
            const limitsEnabled = await token.getGetLimitsEnabled();
            const isExcluded = await token.getIsExcludedFromLimits(senderAddress);
            
            const withinLimits = !limitsEnabled || isExcluded || burnAmount <= transactionLimit;
            console.log(`Within Limits: ${withinLimits ? '✅ Yes' : '❌ No (exceeds transaction limit)'}`);
        } catch (error) {
            console.log(`Within Limits: ⚠️ Unable to check limits`);
        }

        // Calculate burn impact
        const burnPercentage = (Number(burnAmount) / Number(jettonData.totalSupply)) * 100;
        const newTotalSupply = Number(jettonData.totalSupply) - Number(burnAmount);

        console.log('\n📊 Burn Impact Analysis:');
        console.log(`Current Total Supply: ${formatTokenAmount(jettonData.totalSupply, metadata.decimals)} ${metadata.symbol}`);
        console.log(`Burn Amount: ${formatTokenAmount(burnAmount, metadata.decimals)} ${metadata.symbol}`);
        console.log(`Percentage of Supply: ${burnPercentage.toFixed(4)}%`);
        console.log(`New Total Supply: ${formatTokenAmount(BigInt(newTotalSupply), metadata.decimals)} ${metadata.symbol}`);

        // Note about wallet interaction
        console.log('\n⚠️ Important: Burn Operation Requirements');
        console.log('='.repeat(40));
        console.log('• Burn operations require wallet contract interaction');
        console.log('• User must have sufficient token balance');
        console.log('• Burn amount subject to transaction limits');
        console.log('• Gas fees required for burn transactions');
        console.log('• Burned tokens are permanently destroyed');

        // Demonstrate TokenBurn message structure
        console.log('\n📋 TokenBurn Message Structure:');
        console.log('='.repeat(40));

        const tokenBurnMessage = {
            $$type: 'TokenBurn',
            queryId: BigInt(Math.floor(Date.now() / 1000)),
            amount: burnAmount,
            responseDestination: senderAddress,
            customPayload: null
        };

        console.log(JSON.stringify(tokenBurnMessage, (key, value) => 
            typeof value === 'bigint' ? value.toString() : value, 2));

        // Show burn process flow
        console.log('\n🔄 Burn Process Flow:');
        console.log('='.repeat(40));
        console.log('1. User initiates burn from wallet app');
        console.log('2. Wallet sends TokenBurn message to user\'s wallet contract');
        console.log('3. Wallet contract validates burn amount and limits');
        console.log('4. Wallet contract sends TokenBurnNotification to master contract');
        console.log('5. Master contract reduces total supply');
        console.log('6. Burn confirmation sent back to user');
        console.log('7. Tokens permanently removed from circulation');

        // Gas estimation for burns
        console.log('\n⛽ Gas Estimation for Burns:');
        console.log('='.repeat(40));
        console.log('• Simple burn: ~0.05-0.1 TON');
        console.log('• Burn with notification: ~0.1-0.15 TON');
        console.log('• Large burns may require more gas');
        console.log('• Gas depends on network congestion');

        // Burn safety checklist
        console.log('\n✅ Burn Safety Checklist:');
        console.log('='.repeat(40));
        const safetyChecks = [
            'Verify burn amount is correct',
            'Confirm sufficient token balance',
            'Check transaction limit compliance',
            'Understand burn is irreversible',
            'Have sufficient TON for gas',
            'Use trusted wallet application',
            'Double-check recipient address (if any)',
            'Consider market impact of large burns'
        ];

        for (const check of safetyChecks) {
            console.log(`☐ ${check}`);
        }

        // Burn use cases
        console.log('\n🎯 Common Burn Use Cases:');
        console.log('='.repeat(40));
        const useCases = [
            {
                case: 'Supply Reduction',
                description: 'Permanently reduce token supply to increase scarcity',
                example: 'Quarterly token burns based on revenue'
            },
            {
                case: 'Error Correction',
                description: 'Remove tokens minted in error',
                example: 'Burn excess tokens from failed transaction'
            },
            {
                case: 'Deflationary Mechanism',
                description: 'Regular burns to create deflationary pressure',
                example: 'Burn percentage of transaction fees'
            },
            {
                case: 'User Choice',
                description: 'Users voluntarily burn tokens',
                example: 'Burn tokens for special privileges or rewards'
            }
        ];

        for (const useCase of useCases) {
            console.log(`\n${useCase.case}:`);
            console.log(`  Description: ${useCase.description}`);
            console.log(`  Example: ${useCase.example}`);
        }

        // Monitoring burned tokens
        console.log('\n📈 Monitoring Burn Activity:');
        console.log('='.repeat(40));
        console.log('• Track total supply changes over time');
        console.log('• Monitor burn transaction frequency');
        console.log('• Analyze burn amounts and patterns');
        console.log('• Calculate cumulative burned tokens');
        console.log('• Assess market impact of burns');

        console.log('\n💡 Best Practices:');
        console.log('• Start with small test burns');
        console.log('• Communicate burn plans to community');
        console.log('• Document burn reasons and amounts');
        console.log('• Monitor market reaction to burns');
        console.log('• Consider burn timing and frequency');
        console.log('• Maintain transparency about burn policies');

        console.log('\n⚠️ Burn Operation Warnings:');
        console.log('• Burned tokens cannot be recovered');
        console.log('• Large burns may impact token price');
        console.log('• Ensure sufficient balance before burning');
        console.log('• Consider community sentiment');
        console.log('• Verify burn amount calculations');
        console.log('• Test on small amounts first');

    } catch (error) {
        console.error('❌ Error in burn operations:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('• Check contract address is correct');
        console.log('• Verify sufficient token balance');
        console.log('• Ensure burn amount within limits');
        console.log('• Check network connectivity');
        console.log('• Verify wallet connection');
        console.log('• Ensure sufficient gas for transaction');
    }
}
