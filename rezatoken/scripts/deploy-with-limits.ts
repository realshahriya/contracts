import { toNano, beginCell } from '@ton/core';
import { RezaToken } from '../wrappers/RezaToken';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    // Create content cell with different metadata to get a new address
    const content = beginCell()
        .storeUint(0, 8)
        .storeStringTail("https://raw.githubusercontent.com/RealShahriya/RezaToken/main/metadata-v2.json")
        .endCell();

    const rezaToken = provider.open(await RezaToken.fromInit(provider.sender().address!, content));

    console.log('Deploying RezaToken with transaction limits...');
    console.log('Contract address:', rezaToken.address.toString());

    await rezaToken.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        'Deploy'
    );

    await provider.waitForDeploy(rezaToken.address);

    console.log('✅ Contract deployed successfully!');

    // Enable limits immediately
    console.log('Enabling transaction limits...');
    await rezaToken.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'SetLimitsEnabled',
            enabled: true,
        }
    );

    console.log('✅ Transaction limits enabled!');

    // Premint some tokens
    console.log('Preminting 1,000,000 RTZ tokens...');
    await rezaToken.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Mint',
            amount: toNano('1000000'), // 1M RTZ
            receiver: provider.sender().address!,
        }
    );

    console.log('✅ Tokens preminted!');

    // Wait a bit and check final state
    await new Promise(resolve => setTimeout(resolve, 5000));

    const jettonData = await rezaToken.getGetJettonData();
    const limitsEnabled = await rezaToken.getGetLimitsEnabled();
    const maxTxAmount = await rezaToken.getGetMaxTxAmount();
    const maxWalletAmount = await rezaToken.getGetMaxWalletAmount();

    console.log('\n📊 Final Contract State:');
    console.log('Contract Address:', rezaToken.address.toString());
    console.log('Total Supply:', (Number(jettonData.totalSupply) / 1000000000).toLocaleString(), 'RTZ');
    console.log('Mintable:', jettonData.mintable);
    console.log('Limits Enabled:', limitsEnabled);
    console.log('Max Transaction:', (Number(maxTxAmount) / 1000000000).toLocaleString(), 'RTZ');
    console.log('Max Wallet:', (Number(maxWalletAmount) / 1000000000).toLocaleString(), 'RTZ');

    console.log('\n🎉 Deployment completed!');
    console.log('The contract now enforces transaction limits in the wallet contract.');
    console.log('Try sending more than 10M RTZ to test the limits!');
}