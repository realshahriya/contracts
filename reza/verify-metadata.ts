import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano, beginCell, Dictionary } from '@ton/core';
import { JettonMinter } from './wrappers/JettonMinter';
import { sha256_sync } from '@ton/crypto';
import { compile } from '@ton/blueprint';
import '@ton/test-utils';

async function verifyMetadata() {
    console.log('🔍 Verifying jetton metadata format...');
    
    const minterCode = await compile('JettonMinter');
    const walletCode = await compile('JettonWallet');
    
    const blockchain = await Blockchain.create();
    const deployer = await blockchain.treasury('deployer');
    
    // Create proper TEP-64 compliant metadata using dictionary format with SHA256 keys
    const jettonContent = beginCell()
        .storeUint(0, 8) // onchain content tag
        .storeDict(
            Dictionary.empty(Dictionary.Keys.Buffer(32), Dictionary.Values.Cell())
                .set(sha256_sync("name"), beginCell().storeUint(0, 8).storeStringTail("Reza Token").endCell())
                .set(sha256_sync("symbol"), beginCell().storeUint(0, 8).storeStringTail("REZA").endCell())
                .set(sha256_sync("description"), beginCell().storeUint(0, 8).storeStringTail("Reza Token - A sample jetton implementation").endCell())
                .set(sha256_sync("decimals"), beginCell().storeUint(0, 8).storeStringTail("9").endCell())
        )
        .endCell();

    const jettonMinter = blockchain.openContract(JettonMinter.createFromConfig({
        admin: deployer.address,
        content: jettonContent,
        wallet_code: walletCode,
        sell_limit: toNano('1'),
    }, minterCode));

    // Deploy minter
    await jettonMinter.sendDeploy(deployer.getSender(), toNano('0.05'));

    // Get jetton data to verify metadata
    const jettonData = await jettonMinter.getJettonData();
    
    console.log('📊 Jetton Data:');
    console.log('  Total Supply:', jettonData.totalSupply.toString());
    console.log('  Admin Address:', jettonData.adminAddress.toString());
    console.log('  Mintable:', jettonData.mintable);
    
    // Parse the content cell to verify metadata structure
    console.log('\n📝 Metadata Content:');
    try {
        const contentSlice = jettonData.content.beginParse();
        const contentTag = contentSlice.loadUint(8);
        console.log('  Content Tag:', contentTag, '(should be 0 for onchain)');
        
        // Try to parse dictionary
        const metadata: Record<string, string> = {};
        
        if (contentSlice.remainingBits > 0 || contentSlice.remainingRefs > 0) {
            try {
                const dict = contentSlice.loadDict(Dictionary.Keys.Buffer(32), Dictionary.Values.Cell());
                
                // Parse specific keys using SHA256 hashes
                const keys = ['name', 'symbol', 'description', 'decimals'];
                for (const key of keys) {
                    const keyHash = sha256_sync(key);
                    const valueCell = dict.get(keyHash);
                    if (valueCell) {
                        const valueSlice = valueCell.beginParse();
                        valueSlice.loadUint(8); // skip the 0x00 prefix
                        const value = valueSlice.loadStringTail();
                        metadata[key] = value;
                        console.log(`  ${key}: "${value}"`);
                    }
                }
            } catch (e) {
                console.log('  Error parsing dictionary:', e);
            }
        }
        
        console.log('\n✅ Parsed Metadata:');
        console.log('  Name:', metadata.name || 'NOT FOUND');
        console.log('  Symbol:', metadata.symbol || 'NOT FOUND');
        console.log('  Description:', metadata.description || 'NOT FOUND');
        console.log('  Decimals:', metadata.decimals || 'NOT FOUND');
        
        if (metadata.name === 'Reza Token' && metadata.symbol === 'REZA') {
            console.log('\n🎉 SUCCESS: Metadata is properly formatted!');
            console.log('   Your token should now display as "Reza Token (REZA)" instead of "UKWN6c23"');
        } else {
            console.log('\n❌ ISSUE: Metadata format may still have problems');
        }
        
    } catch (e) {
        console.log('❌ Error parsing metadata:', e);
    }
}

verifyMetadata().catch(console.error);