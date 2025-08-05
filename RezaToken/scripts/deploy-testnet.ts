import { toNano, Address } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { RezaTokenMinter } from '../wrappers/RezaTokenMinter';
import { PriceFeed } from '../wrappers/PriceFeed';

export async function run(provider: NetworkProvider) {
    console.log('🧪 Deploying RezaToken to TESTNET...\n');

    // Testnet-specific configuration
    const TESTNET_CONFIG = {
        initialTonUsdRate: 2500000, // $2.50 per TON
        initialMintAmount: toNano('1000'), // 1000 RTZ for testing
        deploymentGas: toNano('0.2'), // Higher gas for testnet
    };

    const deployer = provider.sender();
    const deployerAddress = deployer.address!;
    
    console.log('📋 Testnet Deployment Configuration:');
    console.log(`Deployer: ${deployerAddress.toString()}`);
    console.log(`Network: ${provider.network()}`);
    console.log(`Initial TON/USD Rate: $${(TESTNET_CONFIG.initialTonUsdRate / 1000000).toFixed(2)}`);
    console.log(`Initial Mint Amount: ${TESTNET_CONFIG.initialMintAmount.toString()} nanoRTZ`);
    console.log('');

    try {
        // Deploy PriceFeed
        console.log('📊 Deploying PriceFeed...');
        const priceFeed = provider.open(
            PriceFeed.createFromConfig(
                { owner: deployerAddress },
                await compile('PriceFeed')
            )
        );

        await priceFeed.sendDeploy(provider.sender(), TESTNET_CONFIG.deploymentGas);
        await provider.waitForDeploy(priceFeed.address);
        console.log(`✅ PriceFeed: ${priceFeed.address.toString()}`);

        // Create simple testnet content
        const jettonContent = createSimpleContent();

        // Deploy RezaTokenMinter
        console.log('🪙 Deploying RezaTokenMinter...');
        const rezaTokenMinter = provider.open(
            RezaTokenMinter.createFromConfig(
                {
                    owner: deployerAddress,
                    content: jettonContent,
                    priceFeed: priceFeed.address,
                },
                await compile('RezaTokenMinter')
            )
        );

        await rezaTokenMinter.sendDeploy(provider.sender(), TESTNET_CONFIG.deploymentGas);
        await provider.waitForDeploy(rezaTokenMinter.address);
        console.log(`✅ RezaTokenMinter: ${rezaTokenMinter.address.toString()}`);

        // Mint initial tokens for testing
        console.log('🪙 Minting initial test tokens...');
        await rezaTokenMinter.sendMint(
            provider.sender(),
            {
                value: toNano('0.1'),
                amount: TESTNET_CONFIG.initialMintAmount,
                receiver: deployerAddress,
            }
        );

        // Get wallet address for deployer
        const walletAddress = await rezaTokenMinter.getWalletAddress(deployerAddress);
        
        console.log('\n🎉 Testnet Deployment Complete!');
        console.log('================================');
        console.log(`PriceFeed: ${priceFeed.address.toString()}`);
        console.log(`RezaTokenMinter: ${rezaTokenMinter.address.toString()}`);
        console.log(`Your Wallet: ${walletAddress.toString()}`);
        console.log(`Testnet Explorer: https://testnet.tonscan.org/address/${rezaTokenMinter.address.toString()}`);
        
        console.log('\n🧪 Testing Commands:');
        console.log('===================');
        console.log('# Update price feed:');
        console.log(`npx blueprint run updatePrice --custom ${priceFeed.address.toString()}`);
        console.log('\n# Approve sale for user:');
        console.log(`npx blueprint run approveSale --custom ${rezaTokenMinter.address.toString()}`);
        console.log('\n# Check wallet balance:');
        console.log(`npx blueprint run checkBalance --custom ${walletAddress.toString()}`);

    } catch (error) {
        console.error('❌ Deployment failed:', error);
        throw error;
    }
}

function createSimpleContent() {
    const { beginCell } = require('@ton/core');
    return beginCell()
        .storeUint(0, 8) // onchain content flag
        .storeStringTail('RezaToken Testnet')
        .endCell();
}

async function compile(name: string) {
    const { Cell } = require('@ton/core');
    const result = await import(`../build/${name}.compiled.json`);
    return Cell.fromBoc(Buffer.from(result.hex, 'hex'))[0];
}