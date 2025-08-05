import { toNano, Address, Cell, beginCell, OpenedContract } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { RezaTokenMinter } from '../build/RezaTokenMinter_RezaTokenMinter';
import { PriceFeed } from '../build/PriceFeed_PriceFeed';

export async function run(provider: NetworkProvider) {
    console.log('🚀 Starting RezaToken deployment...\n');

    // Get deployer wallet
    const deployer = provider.sender();
    const deployerAddress = deployer.address!;
    
    console.log('📋 Deployment Configuration:');
    console.log(`Deployer: ${deployerAddress.toString()}`);
    console.log(`Network: ${provider.network()}`);
    console.log('');

    // Step 1: Deploy PriceFeed contract
    console.log('📊 Deploying PriceFeed contract...');
    
    const priceFeed: OpenedContract<PriceFeed> = provider.open(await PriceFeed.fromInit(deployerAddress));

    await priceFeed.send(provider.sender(), { value: toNano('0.05') }, { $$type: 'Deploy', queryId: BigInt(0) });
    await provider.waitForDeploy(priceFeed.address);
    
    console.log(`✅ PriceFeed deployed at: ${priceFeed.address.toString()}`);

    // Step 2: Create Jetton content (metadata)
    const jettonContent = createJettonContent({
        name: "RezaToken",
        symbol: "RTZ",
        description: "RezaToken - A modern Jetton with sale approval mechanism",
        decimals: "18",
        image: "https://example.com/reza-token-logo.png", // Replace with actual logo URL
    });

    // Step 3: Deploy RezaTokenMinter contract
    console.log('🪙 Deploying RezaTokenMinter contract...');
    
    const rezaTokenMinter: OpenedContract<RezaTokenMinter> = provider.open(await RezaTokenMinter.fromInit(
        deployerAddress,
        jettonContent,
        priceFeed.address
    ));

    await rezaTokenMinter.send(provider.sender(), { value: toNano('0.1') }, { $$type: 'Deploy', queryId: BigInt(0) });
    await provider.waitForDeploy(rezaTokenMinter.address);
    
    console.log(`✅ RezaTokenMinter deployed at: ${rezaTokenMinter.address.toString()}`);

    // Step 4: Verify deployment and get initial data
    console.log('\n🔍 Verifying deployment...');
    
    const jettonData = await rezaTokenMinter.getGetJettonData();
    const priceFeedRate = await priceFeed.getGetTonUsdRate();
    
    console.log('\n📊 Deployment Summary:');
    console.log('========================');
    console.log(`PriceFeed Address: ${priceFeed.address.toString()}`);
    console.log(`RezaTokenMinter Address: ${rezaTokenMinter.address.toString()}`);
    console.log(`Initial TON/USD Rate: $${(Number(priceFeedRate) / 1000000).toFixed(2)}`);
    console.log(`Total Supply: ${jettonData.totalSupply.toString()} nanoRTZ`);
    console.log(`Mintable: ${jettonData.mintable}`);
    console.log(`Admin: ${jettonData.adminAddress.toString()}`);
    
    // Step 5: Optional initial minting
    const shouldMintInitial = await provider.ui().input('Do you want to mint initial tokens (100 RTZ)?');
    
    if (shouldMintInitial === 'y') {
        console.log('\n🪙 Minting initial tokens...');
        await rezaTokenMinter.send(
            provider.sender(),
            { value: toNano('0.1') },
            {
                $$type: 'Mint',
                amount: toNano('100'), // 100 RTZ
                receiver: deployerAddress,
            }
        );
        console.log('✅ Initial tokens minted successfully!');
    }

    console.log('\n🎉 Deployment completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update price feed as needed using updatePrice message');
    console.log('2. Approve sales for users using approveSale message');
    console.log('3. Test token transfers and sale approvals');
    console.log('4. Consider closing minting when appropriate');
}

// Helper function to create Jetton content cell
function createJettonContent(metadata: {
    name: string;
    symbol: string;
    description: string;
    decimals: string;
    image?: string;
}): Cell {
    const contentDict = beginCell();
    
    // Add metadata according to TEP-64 standard
    contentDict.storeUint(0, 8); // onchain content flag
    
    const metadataDict = beginCell();
    
    // Name
    metadataDict.storeRef(
        beginCell()
            .storeUint(0, 8)
            .storeStringTail(metadata.name)
            .endCell()
    );
    
    // Symbol  
    metadataDict.storeRef(
        beginCell()
            .storeUint(0, 8)
            .storeStringTail(metadata.symbol)
            .endCell()
    );
    
    // Description
    metadataDict.storeRef(
        beginCell()
            .storeUint(0, 8)
            .storeStringTail(metadata.description)
            .endCell()
    );
    
    // Decimals
    metadataDict.storeRef(
        beginCell()
            .storeUint(0, 8)
            .storeStringTail(metadata.decimals)
            .endCell()
    );
    
    // Image (optional)
    if (metadata.image) {
        metadataDict.storeRef(
            beginCell()
                .storeUint(0, 8)
                .storeStringTail(metadata.image)
                .endCell()
        );
    }
    
    contentDict.storeRef(metadataDict.endCell());
    
    return contentDict.endCell();
}

// Import compile function
async function compile(name: string) {
    const result = await import(`../build/${name}.compiled.json`);
    return Cell.fromBoc(Buffer.from(result.hex, 'hex'))[0];
}