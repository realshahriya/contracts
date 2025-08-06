import { Address, toNano } from '@ton/core';
import { RezaToken } from '../build/Token/Token_RezaToken';
import { NetworkProvider } from '@ton/blueprint';
import { buildOnchainMetadata } from '../utils/jetton-helpers';

export async function run(provider: NetworkProvider) {
    console.log('🚀 Deploying RezaToken...');
    
    // Create metadata for the token (important for wallets and explorers)
    const jettonParams = {
        name: "RezaToken",
        description: "Official token of the Reza Token",
        symbol: "RTZ",
        image: "https://violet-traditional-rabbit-103.mypinata.cloud/ipfs/QmUgZ3kWg36tCVSZeVKXkvsdXkn6dqigqjoBZto9Y8h37z",
        decimals: "9"
    };

    // Create content Cell with metadata
    let content = buildOnchainMetadata(jettonParams);
    
    // Initialize the RezaToken contract with the deployer as owner and metadata content
    const rezaToken = provider.open(await RezaToken.fromInit(provider.sender().address as Address, content));

    // Deploy the contract
    await rezaToken.send(
        provider.sender(),
        {
            value: toNano('0.05'), // Increased deployment fee for contract initialization
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(rezaToken.address);

    console.log('✅ RezaToken deployed successfully!');
    console.log('📍 Contract Address:', rezaToken.address);
    console.log('👤 Owner:', provider.sender().address);
    
    // Get and display token information
    try {
        const jettonData = await rezaToken.getGetJettonData();
        const maxSellLimit = await rezaToken.getGetMaxSellLimit();
        
        console.log('\n📊 Token Information:');
        console.log('🏷️  Name: RezaToken');
        console.log('🔤 Symbol: RTZ');
        console.log('🔢 Decimals: 9');
        console.log('💰 Total Supply:', jettonData.total_supply.toString(), 'tokens');
        console.log('🔒 Mintable:', jettonData.mintable);
        console.log('👤 Admin:', jettonData.admin_address.toString());
        console.log('💵 Max Sell Limit (without approval):', maxSellLimit.toString(), 'nanotons (~$1)');
        
        console.log('\n🎉 RezaToken is ready for use!');
        console.log('📝 Features:');
        console.log('   • Fixed supply of 1,000,000 RTZ tokens');
        console.log('   • Sell restriction: transfers > $1 require owner approval');
        console.log('   • Owner can approve/revoke high-value sales for specific addresses');
        
    } catch (error) {
        console.log('⚠️  Could not fetch token data (contract may still be initializing)');
        console.log('Error:', error);
    }
}