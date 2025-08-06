import { toNano, beginCell } from '@ton/core';
import { RezaTokenMinter } from '../build/RezaTokenMinter/RezaTokenMinter_RezaTokenMinter';
import { PriceFeed } from '../build/PriceFeed/PriceFeed_PriceFeed';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    console.log('🚀 Starting deployment of RezaToken contracts...\n');

    // Step 1: Deploy PriceFeed contract
    console.log('📊 Deploying PriceFeed contract...');
    const priceFeed = provider.open(await PriceFeed.fromInit(
        provider.sender().address! // owner
    ));

    await priceFeed.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        },
    );

    await provider.waitForDeploy(priceFeed.address);
    console.log('✅ PriceFeed deployed at:', priceFeed.address);
    console.log('   Default TON/USD rate:', await priceFeed.getGetTonUsdRate());

    // Step 2: Create token metadata content
    console.log('\n📝 Creating token metadata...');
    const content = beginCell()
        .storeUint(0, 8) // onchain content flag
        .storeStringTail("RezaToken") // name
        .storeStringTail("RTZ") // symbol
        .storeStringTail("18") // decimals
        .storeStringTail("Reza Token - A deflationary token with sale approval mechanism") // description
        .endCell();

    // Step 3: Deploy RezaTokenMinter contract
    console.log('🪙 Deploying RezaTokenMinter contract...');
    const token = provider.open(await RezaTokenMinter.fromInit(
        provider.sender().address!, // owner
        content, // token metadata
        priceFeed.address // price feed contract address
    ));

    await token.send(
        provider.sender(),
        {
            value: toNano('0.1'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        },
    );

    await provider.waitForDeploy(token.address);
    console.log('✅ RezaTokenMinter deployed at:', token.address);

    // Step 4: Display deployment summary
    console.log('\n📋 Deployment Summary:');
    console.log('='.repeat(50));
    console.log('Owner Address:', provider.sender().address);
    console.log('PriceFeed Address:', priceFeed.address);
    console.log('RezaTokenMinter Address:', token.address);
    
    // Get token data
    const jettonData = await token.getGetJettonData();
    console.log('\n🪙 Token Information:');
    console.log('Name:', await token.getName());
    console.log('Symbol:', await token.getSymbol());
    console.log('Decimals:', await token.getDecimals());
    console.log('Total Supply:', jettonData.totalSupply.toString());
    console.log('Mintable:', jettonData.mintable);
    console.log('Admin Address:', jettonData.adminAddress);

    console.log('\n🎉 Deployment completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('1. Update TON/USD price in PriceFeed if needed');
    console.log('2. Mint initial tokens using the Mint message');
    console.log('3. Set up sale approvals for users if required');
}
