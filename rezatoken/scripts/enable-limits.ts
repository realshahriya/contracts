import { toNano, Address } from '@ton/core';
import { RezaToken } from '../wrappers/RezaToken';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const contractAddress = Address.parse('EQAlxiiyNpRBKYyj1SZO0rkc_AQqfQTdj0CjGBAF-cjr9w5n');
    const rezaToken = provider.open(RezaToken.fromAddress(contractAddress));

    console.log('Enabling transaction limits...');

    // Get current state
    const jettonData = await rezaToken.getGetJettonData();
    const limitsEnabled = await rezaToken.getGetLimitsEnabled();
    
    console.log('Current limits enabled:', limitsEnabled);
    console.log('Contract owner:', jettonData.owner.toString());

    if (!limitsEnabled) {
        console.log('Enabling transaction limits...');
        
        await rezaToken.send(
            provider.sender(),
            {
                value: toNano('0.05'),
                bounce: false,
            },
            {
                $$type: 'SetLimitsEnabled',
                enabled: true,
            }
        );

        console.log('Transaction sent to enable limits!');
        console.log('Waiting a few seconds for confirmation...');
        
        // Wait a bit for the transaction to process
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check updated state
        const updatedLimitsEnabled = await rezaToken.getGetLimitsEnabled();
        console.log('Updated limits enabled:', updatedLimitsEnabled);
    } else {
        console.log('Limits are already enabled!');
    }

    // Show current limits
    const maxTxAmount = await rezaToken.getGetMaxTxAmount();
    const maxWalletAmount = await rezaToken.getGetMaxWalletAmount();
    
    console.log('\nCurrent transaction limits:');
    console.log('Max transaction:', (Number(maxTxAmount) / 1000000000).toLocaleString(), 'RTZ');
    console.log('Max wallet:', (Number(maxWalletAmount) / 1000000000).toLocaleString(), 'RTZ');
    
    console.log('\nTransaction limits are now active!');
    console.log('The wallet contract will enforce these limits on all transfers.');
}