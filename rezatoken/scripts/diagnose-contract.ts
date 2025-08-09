import { Address } from '@ton/core';
import { RezaToken } from '../wrappers/RezaToken';
import { NetworkProvider } from '@ton/blueprint';
import { extractMetadata, formatTokenAmount } from '../utils/metadata-helpers';
import { CONFIG, validateConfig } from './config';

export async function run(provider: NetworkProvider) {
    console.log('🔍 Contract Diagnosis - Checking for Issues');
    console.log('='.repeat(50));

    // Get contract address from config
    const contractAddressStr = CONFIG.CONTRACT_ADDRESS;
    const network = CONFIG.NETWORK;
    
    console.log('📋 Configuration:');
    console.log('Contract Address:', contractAddressStr);
    console.log('Network:', network);
    
    if (!contractAddressStr) {
        console.log('❌ ERROR: No CONTRACT_ADDRESS found in .env file');
        return;
    }

    // Check address format
    console.log('\n🔍 Address Analysis:');
    if (contractAddressStr.startsWith('EQ')) {
        console.log('✅ Testnet format address detected (EQ...)');
    } else if (contractAddressStr.startsWith('kQ')) {
        console.log('⚠️  Mainnet format address detected (kQ...)');
        if (network === 'testnet') {
            console.log('❌ MISMATCH: Mainnet address but testnet network configured!');
        }
    } else {
        console.log('❌ Unknown address format');
    }

    try {
        const contractAddress = Address.parse(contractAddressStr);
        const rezaToken = provider.open(RezaToken.fromAddress(contractAddress));

        console.log('\n📊 Contract Status:');
        console.log('Parsed Address:', contractAddress.toString());
        
        // Try to get basic data
        try {
            const jettonData = await rezaToken.getGetJettonData();
            console.log('✅ Contract is accessible');
            
            // Extract metadata
            const metadata = extractMetadata(jettonData.content);
            
            console.log('\n🏷️ Token Information:');
            console.log('Name:', metadata.name);
            console.log('Symbol:', metadata.symbol);
            console.log('Decimals:', metadata.decimals);
            console.log('Total Supply:', formatTokenAmount(jettonData.totalSupply, metadata.decimals, metadata.symbol));
            console.log('Mintable:', jettonData.mintable);
            console.log('Owner:', jettonData.owner.toString());

            // Check transaction limits
            console.log('\n🚦 Transaction Limits:');
            try {
                const limitsEnabled = await rezaToken.getGetLimitsEnabled();
                const maxTxAmount = await rezaToken.getGetMaxTxAmount();
                const maxWalletAmount = await rezaToken.getGetMaxWalletAmount();
                
                console.log('✅ Transaction limits available');
                console.log('Limits Enabled:', limitsEnabled);
                console.log('Max Transaction:', formatTokenAmount(maxTxAmount, metadata.decimals, metadata.symbol));
                console.log('Max Wallet:', formatTokenAmount(maxWalletAmount, metadata.decimals, metadata.symbol));
                
            } catch (error) {
                console.log('❌ Transaction limits not available:', error instanceof Error ? error.message : String(error));
            }

        } catch (error) {
            console.log('❌ Contract not accessible:', error instanceof Error ? error.message : String(error));
            
            // Suggest fixes
            console.log('\n🔧 Suggested Fixes:');
            if (contractAddressStr.startsWith('kQ') && network === 'testnet') {
                console.log('1. Change NETWORK=mainnet in .env file');
                console.log('2. Or deploy a new contract to testnet');
            }
            console.log('3. Verify the contract address is correct');
            console.log('4. Check if the contract is deployed on the correct network');
        }

    } catch (error) {
        console.log('❌ Invalid contract address format:', error instanceof Error ? error.message : String(error));
    }

    console.log('\n📝 Recommendations:');
    console.log('1. Ensure network and address format match');
    console.log('2. Use testnet for development (EQ... addresses)');
    console.log('3. Use mainnet for production (kQ... addresses)');
    console.log('4. Update .env file accordingly');
}