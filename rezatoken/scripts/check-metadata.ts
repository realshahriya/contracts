import { Address } from '@ton/core';
import { RezaToken } from '../wrappers/RezaToken';
import { NetworkProvider } from '@ton/blueprint';
import { extractMetadata } from '../utils/metadata-helpers';
import { getContractAddress } from './config';

export async function run(provider: NetworkProvider) {
    console.log('🔍 Checking Contract Metadata');
    console.log('='.repeat(50));

    // Use the contract address from config
    const contractAddress = getContractAddress();
    const rezaToken = provider.open(RezaToken.fromAddress(contractAddress));

    console.log('Contract Address:', contractAddress.toString());

    try {
        // Get jetton data
        const jettonData = await rezaToken.getGetJettonData();
        console.log('\n📊 Raw Jetton Data:');
        console.log('Total Supply:', jettonData.totalSupply.toString());
        console.log('Mintable:', jettonData.mintable);
        console.log('Owner:', jettonData.owner.toString());
        console.log('Content Cell:', jettonData.content.toString());

        // Try to extract metadata
        console.log('\n🏷️ Extracted Metadata:');
        const metadata = extractMetadata(jettonData.content);
        console.log('Name:', metadata.name);
        console.log('Symbol:', metadata.symbol);
        console.log('Decimals:', metadata.decimals);
        console.log('Description:', metadata.description);

        // Check if content cell is empty or malformed
        console.log('\n🔬 Content Cell Analysis:');
        const slice = jettonData.content.beginParse();
        console.log('Remaining bits:', slice.remainingBits);
        console.log('Remaining refs:', slice.remainingRefs);
        
        if (slice.remainingBits >= 8) {
            const prefix = slice.loadUint(8);
            console.log('Content prefix:', prefix.toString(16));
            
            if (prefix === 0x00) {
                console.log('✅ Onchain metadata detected');
            } else if (prefix === 0x01) {
                console.log('🌐 Offchain metadata detected');
            } else {
                console.log('❌ Unknown metadata format');
            }
        } else {
            console.log('❌ Content cell appears to be empty or malformed');
        }

    } catch (error) {
        console.error('❌ Error checking metadata:', error);
    }
}