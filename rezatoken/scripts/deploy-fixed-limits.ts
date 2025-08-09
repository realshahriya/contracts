import { toNano } from '@ton/core';
import { RezaToken } from '../wrappers/RezaToken';
import { NetworkProvider } from '@ton/blueprint';
import { buildOnchainMetadata } from '../utils/jetton-helpers';

export async function run(provider: NetworkProvider) {
    console.log('🚀 Deploying RezaToken with FIXED Transaction Limits');
    console.log('='.repeat(60));

    // Create metadata
    const jettonParams = {
        name: "RezaToken",
        description: "RezaToken - A DEX-compatible Jetton token for TON blockchain. Fully compliant with TEP-74 standard for seamless integration with decentralized exchanges.",
        symbol: "RTZ",
        image: "https://raw.githubusercontent.com/ton-community/jetton-deployer/main/icon.png",
        decimals: 9
    };

    // Build metadata
    const content = buildOnchainMetadata(jettonParams);
    
    // Get deployer address
    const deployer = provider.sender().address!!;
    console.log('Deployer Address:', deployer.toString());

    // Deploy contract
    const rezaToken = provider.open(await RezaToken.fromInit(deployer, content));
    
    console.log('Contract Address:', rezaToken.address.toString());
    console.log('Deploying contract...');

    await rezaToken.send(
        provider.sender(),
        {
            value: toNano('0.5'),
        },
        'Deploy'
    );

    await provider.waitForDeploy(rezaToken.address);
    console.log('✅ Contract deployed successfully!');

    // Configure transaction limits with PROPER values
    console.log('\n⚙️ Configuring Transaction Limits...');
    
    // Set reasonable limits: 10,000 RTZ per transaction, 50,000 RTZ per wallet
    const maxTxAmount = toNano('10000'); // 10,000 RTZ
    const maxWalletAmount = toNano('50000'); // 50,000 RTZ
    
    console.log('Setting transaction limits...');
    await rezaToken.send(
        provider.sender(),
        { value: toNano('0.1') },
        {
            $$type: 'SetTransactionLimit',
            maxTxAmount: maxTxAmount,
            maxWalletAmount: maxWalletAmount
        }
    );

    console.log('Enabling transaction limits...');
    await rezaToken.send(
        provider.sender(),
        { value: toNano('0.1') },
        {
            $$type: 'SetLimitsEnabled',
            enabled: true
        }
    );

    // Mint initial supply
    console.log('\n💰 Minting Initial Supply...');
    const initialSupply = toNano('1000000'); // 1M RTZ
    
    await rezaToken.send(
        provider.sender(),
        { value: toNano('0.2') },
        {
            $$type: 'Mint',
            amount: initialSupply,
            receiver: deployer
        }
    );

    console.log('✅ Initial supply minted!');

    // Verify configuration
    console.log('\n🔍 Verifying Configuration...');
    
    const jettonData = await rezaToken.getGetJettonData();
    const limitsEnabled = await rezaToken.getGetLimitsEnabled();
    const maxTx = await rezaToken.getGetMaxTxAmount();
    const maxWallet = await rezaToken.getGetMaxWalletAmount();
    const ownerExcluded = await rezaToken.getIsExcludedFromLimits(deployer);

    console.log('\n📊 DEPLOYMENT SUMMARY');
    console.log('='.repeat(40));
    console.log('Contract Address:', rezaToken.address.toString());
    console.log('Total Supply:', (Number(jettonData.totalSupply) / 1000000000).toFixed(0), 'RTZ');
    console.log('Limits Enabled:', limitsEnabled);
    console.log('Max Transaction:', (Number(maxTx) / 1000000000).toFixed(0), 'RTZ');
    console.log('Max Wallet:', (Number(maxWallet) / 1000000000).toFixed(0), 'RTZ');
    console.log('Owner Excluded:', ownerExcluded);
    console.log('Owner Address:', deployer.toString());

    console.log('\n✅ DEPLOYMENT COMPLETE!');
    console.log('🔧 Remember to update your .env file with the new contract address:');
    console.log(`CONTRACT_ADDRESS=${rezaToken.address.toString()}`);
    
    console.log('\n⚠️  IMPORTANT NOTES:');
    console.log('• This contract has FIXED transaction limits enforcement');
    console.log('• Limits are properly enforced at both master and wallet levels');
    console.log('• Owner is excluded from limits by default');
    console.log('• Contract is fully DEX-compatible and TEP-74 compliant');
}