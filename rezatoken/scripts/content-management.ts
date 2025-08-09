import { Address, toNano } from '@ton/core';
import { RezaToken } from '../wrappers/RezaToken';
import { NetworkProvider } from '@ton/blueprint';
import { buildOnchainMetadata } from '../utils/jetton-helpers';
import { extractMetadata, formatTokenAmount } from '../utils/metadata-helpers';

export async function run(provider: NetworkProvider) {
    console.log('📝 Content Management Script - RTZ Token');
    console.log('='.repeat(50));

    // Get contract address from environment or use default
    const contractAddressStr = process.env.CONTRACT_ADDRESS || "kQCr3sfrMtkAHdzWGXvYg3qJNrfNcZQ8UHSeNCE6Er8Q-KbS";
    const contractAddress = Address.parse(contractAddressStr);
    const token = provider.open(RezaToken.fromAddress(contractAddress));

    try {
        // Get current contract state
        console.log('\n📊 Current Contract State:');
        const jettonData = await token.getGetJettonData();
        
        // Extract metadata from content
        const metadata = extractMetadata(jettonData.content);
        
        console.log(`Token: ${metadata.name} (${metadata.symbol})`);
        console.log(`Decimals: ${metadata.decimals}`);
        console.log(`Owner: ${jettonData.owner.toString()}`);
        console.log(`Total Supply: ${formatTokenAmount(jettonData.totalSupply, metadata.decimals, metadata.symbol)}`);

        // Check if sender is the owner
        const senderAddress = provider.sender().address;
        if (!senderAddress) {
            console.log('❌ Sender address not available');
            return;
        }

        const isOwner = senderAddress.equals(jettonData.owner);
        console.log(`\n👤 Sender: ${senderAddress.toString()}`);
        console.log(`Is Owner: ${isOwner ? '✅ Yes' : '❌ No'}`);

        if (!isOwner) {
            console.log('\n⚠️ Only the contract owner can update content');
            console.log('This script will demonstrate the process but cannot execute changes');
        }

        // Display current content
        console.log('\n📋 Current Content Information:');
        console.log('='.repeat(40));
        
        try {
            // Parse content cell to extract metadata
            console.log('Content Cell Hash:', jettonData.content.hash().toString('hex'));
            console.log('Content Cell Bits:', jettonData.content.bits.length);
            console.log('Content Cell Refs:', jettonData.content.refs.length);
            
            // Try to parse as onchain metadata
            const slice = jettonData.content.beginParse();
            if (slice.remainingBits >= 8) {
                const prefix = slice.loadUint(8);
                console.log(`Content Prefix: 0x${prefix.toString(16)}`);
                
                if (prefix === 0x00) {
                    console.log('Content Type: Onchain Metadata');
                } else if (prefix === 0x01) {
                    console.log('Content Type: Offchain Metadata');
                } else {
                    console.log('Content Type: Unknown');
                }
            }
        } catch (e) {
            console.log('Content parsing error:', e);
        }

        // Demonstrate content update scenarios
        console.log('\n🎯 Content Update Scenarios:');
        console.log('='.repeat(40));

        // Scenario 1: Update description
        const updatedMetadata1 = {
            name: metadata.name,
            symbol: metadata.symbol,
            description: "Updated RezaToken - A secure and feature-rich Jetton with transaction limits and address exclusions",
            decimals: metadata.decimals,
            image: "https://example.com/rezatoken-logo.png"
        };

        console.log('\n1️⃣ Scenario: Update Description');
        console.log('New Description:', updatedMetadata1.description);

        // Scenario 2: Add social links
        const updatedMetadata2 = {
            name: metadata.name,
            symbol: metadata.symbol,
            description: "RezaToken - Advanced Jetton Implementation",
            decimals: metadata.decimals,
            image: "https://example.com/rezatoken-logo.png",
            website: "https://rezatoken.com",
            telegram: "https://t.me/rezatoken",
            twitter: "https://twitter.com/rezatoken"
        };

        console.log('\n2️⃣ Scenario: Add Social Links');
        console.log('Website:', updatedMetadata2.website);
        console.log('Telegram:', updatedMetadata2.telegram);
        console.log('Twitter:', updatedMetadata2.twitter);

        // Scenario 3: Update image
        const updatedMetadata3 = {
            name: metadata.name,
            symbol: metadata.symbol,
            description: "RezaToken - Advanced Jetton Implementation",
            decimals: metadata.decimals,
            image: "https://cdn.rezatoken.com/logo-v2.png"
        };

        console.log('\n3️⃣ Scenario: Update Image');
        console.log('New Image URL:', updatedMetadata3.image);

        // Build new content for demonstration
        const newContent = buildOnchainMetadata(updatedMetadata2);
        console.log('\n🔧 New Content Cell:');
        console.log('Hash:', newContent.hash().toString('hex'));
        console.log('Bits:', newContent.bits.length);
        console.log('Refs:', newContent.refs.length);

        // Example: Update content
        if (isOwner) {
            console.log('\n📤 Updating Contract Content...');
            
            const result = await token.send(
                provider.sender(),
                {
                    value: toNano('0.05'), // Gas fee
                },
                {
                    $$type: 'TokenUpdateContent',
                    content: newContent
                }
            );

            console.log('✅ Content update transaction sent!');

            // Wait for transaction confirmation
            console.log('\n⏳ Waiting for transaction confirmation...');
            await new Promise(resolve => setTimeout(resolve, 10000));

            // Check updated content
            const updatedJettonData = await token.getGetJettonData();
            const updatedContent = updatedJettonData.content;
            console.log('\n📊 Updated Content:');
            console.log('New Hash:', updatedContent.hash().toString('hex'));
            
            if (updatedContent.hash().equals(newContent.hash())) {
                console.log('✅ Content updated successfully!');
            } else {
                console.log('⚠️ Content may still be updating...');
            }

            console.log('\n📋 Verified Updated Contract State:');
            console.log(`Total Supply: ${formatTokenAmount(updatedJettonData.totalSupply, metadata.decimals, metadata.symbol)}`);
            console.log(`Mintable: ${updatedJettonData.mintable}`);
            console.log(`Owner: ${updatedJettonData.owner.toString()}`);

        } else {
            console.log('\n🔒 Owner-only operation - simulation mode');
            console.log('TokenUpdateContent message structure:');
            console.log(JSON.stringify({
                $$type: 'TokenUpdateContent',
                content: 'Cell(' + newContent.hash().toString('hex') + ')'
            }, null, 2));
        }

        // Content validation guidelines
        console.log('\n✅ Content Validation Guidelines:');
        console.log('='.repeat(40));

        const validationRules = [
            'Name: 1-50 characters, descriptive',
            'Symbol: 3-10 characters, uppercase',
            'Description: Clear and informative', 
            'Decimals: Usually 9 for TON ecosystem',
            'Image: Valid HTTPS URL, preferably PNG/SVG',
            'Website: Valid HTTPS URL',
            'Social links: Valid platform URLs'
        ];

        for (const rule of validationRules) {
            console.log(`• ${rule}`);
        }

        // Content best practices
        console.log('\n💡 Content Management Best Practices:');
        console.log('='.repeat(40));

        const bestPractices = [
            'Use onchain metadata for immutability',
            'Keep descriptions concise but informative',
            'Use high-quality, consistent branding',
            'Verify all URLs before updating',
            'Test content updates on testnet first',
            'Document all content changes',
            'Consider gas costs for large updates',
            'Backup original content before changes'
        ];

        for (const practice of bestPractices) {
            console.log(`• ${practice}`);
        }

        // Content structure examples
        console.log('\n📋 Metadata Structure Examples:');
        console.log('='.repeat(40));

        console.log('\nMinimal Metadata:');
        console.log(JSON.stringify({
            name: "Token Name",
            symbol: "TKN",
            decimals: 9
        }, null, 2));

        console.log('\nComplete Metadata:');
        console.log(JSON.stringify({
            name: "Token Name",
            symbol: "TKN",
            description: "Token description",
            decimals: 9,
            image: "https://example.com/logo.png",
            website: "https://example.com",
            telegram: "https://t.me/token",
            twitter: "https://twitter.com/token",
            github: "https://github.com/token"
        }, null, 2));

        console.log('\n⚠️ Important Notes:');
        console.log('• Content updates are permanent');
        console.log('• Only contract owner can update content');
        console.log('• Gas fee required for updates');
        console.log('• Changes affect all wallet displays');
        console.log('• Verify metadata before updating');
        console.log('• Consider community notification');

        console.log('\n🔧 Content Update Process:');
        console.log('1. Prepare new metadata object');
        console.log('2. Build onchain content cell');
        console.log('3. Send TokenUpdateContent message');
        console.log('4. Wait for transaction confirmation');
        console.log('5. Verify updated content');
        console.log('6. Test with wallet applications');

    } catch (error) {
        console.error('❌ Error in content management:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('• Verify you are the contract owner');
        console.log('• Check contract address is correct');
        console.log('• Ensure sufficient gas for transactions');
        console.log('• Verify metadata format is correct');
        console.log('• Check network connectivity');
        console.log('• Validate all URLs in metadata');
    }
}
