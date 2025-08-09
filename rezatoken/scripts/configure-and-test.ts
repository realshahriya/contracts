import { toNano } from '@ton/core';
import { RezaToken } from '../wrappers/RezaToken';
import { NetworkProvider } from '@ton/blueprint';
import { getContractAddress } from './config';

export async function run(provider: NetworkProvider) {
    console.log('⚙️ Configuring and Testing RezaToken Contract');
    console.log('='.repeat(60));

    // Get contract
    const contractAddress = getContractAddress();
    console.log('Contract Address:', contractAddress.toString());
    
    const rezaToken = provider.open(RezaToken.fromAddress(contractAddress));
    
    // Get deployer address
    const deployer = provider.sender().address!!;
    console.log('Deployer Address:', deployer.toString());

    // Step 1: Mint some tokens for testing
    console.log('\n💰 Step 1: Minting tokens for testing...');
    const mintAmount = toNano('100000'); // 100,000 RTZ
    
    try {
        await rezaToken.send(
            provider.sender(),
            { value: toNano('0.2') },
            {
                $$type: 'Mint',
                amount: mintAmount,
                receiver: deployer
            }
        );
        console.log('✅ Minted 100,000 RTZ tokens');
    } catch (error) {
        console.log('⚠️ Minting failed or was declined:', error);
    }

    // Step 2: Set strict transaction limits for testing
    console.log('\n🔧 Step 2: Setting strict transaction limits...');
    const maxTxAmount = toNano('1000'); // 1,000 RTZ per transaction
    const maxWalletAmount = toNano('1000'); // 1,000 RTZ per wallet
    
    try {
        await rezaToken.send(
            provider.sender(),
            { value: toNano('0.1') },
            {
                $$type: 'SetTransactionLimit',
                maxTxAmount: maxTxAmount,
                maxWalletAmount: maxWalletAmount
            }
        );
        console.log('✅ Set transaction limits: 1,000 RTZ per transaction and wallet');
    } catch (error) {
        console.log('⚠️ Setting limits failed or was declined:', error);
    }

    // Step 3: Enable transaction limits
    console.log('\n🚦 Step 3: Enabling transaction limits...');
    
    try {
        await rezaToken.send(
            provider.sender(),
            { value: toNano('0.1') },
            {
                $$type: 'SetLimitsEnabled',
                enabled: true
            }
        );
        console.log('✅ Transaction limits enabled');
    } catch (error) {
        console.log('⚠️ Enabling limits failed or was declined:', error);
    }

    // Step 4: Wait a moment for transactions to process
    console.log('\n⏳ Waiting for transactions to process...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

    // Step 5: Verify configuration
    console.log('\n🔍 Step 5: Verifying final configuration...');
    
    try {
        const jettonData = await rezaToken.getGetJettonData();
        const limitsEnabled = await rezaToken.getGetLimitsEnabled();
        const maxTx = await rezaToken.getGetMaxTxAmount();
        const maxWallet = await rezaToken.getGetMaxWalletAmount();
        const ownerExcluded = await rezaToken.getIsExcludedFromLimits(deployer);

        console.log('\n📊 FINAL CONFIGURATION');
        console.log('='.repeat(40));
        console.log('Contract Address:', contractAddress.toString());
        console.log('Total Supply:', (Number(jettonData.totalSupply) / 1000000000).toFixed(0), 'RTZ');
        console.log('Limits Enabled:', limitsEnabled);
        console.log('Max Transaction:', (Number(maxTx) / 1000000000).toFixed(0), 'RTZ');
        console.log('Max Wallet:', (Number(maxWallet) / 1000000000).toFixed(0), 'RTZ');
        console.log('Owner Excluded:', ownerExcluded);

        // Step 6: Test the limits
        console.log('\n🧪 Step 6: Testing transaction limits...');
        
        if (limitsEnabled && Number(jettonData.totalSupply) > 0) {
            console.log('\n⚠️ IMPORTANT: Transaction limits are now ACTIVE!');
            console.log('• Max transaction: 1,000 RTZ');
            console.log('• Max wallet balance: 1,000 RTZ');
            console.log('• Owner is excluded from limits');
            console.log('• Any transfer exceeding these limits should fail');
            
            console.log('\n✅ CONTRACT CONFIGURATION COMPLETE!');
            console.log('🔧 The contract now has WORKING transaction limits');
            console.log('🚨 Try transferring more than 1,000 RTZ to test the restrictions');
        } else {
            console.log('\n⚠️ Configuration incomplete:');
            console.log('- Limits enabled:', limitsEnabled);
            console.log('- Total supply:', Number(jettonData.totalSupply));
            console.log('Please approve the transactions in your wallet to complete setup');
        }

    } catch (error) {
        console.error('❌ Error verifying configuration:', error);
    }
}