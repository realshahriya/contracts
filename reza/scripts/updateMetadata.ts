import { toNano, beginCell, Dictionary, Address } from '@ton/core';
import { JettonMinter } from '../wrappers/JettonMinter';
import { sha256_sync } from '@ton/crypto';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    // Replace with your deployed jetton minter address
    const jettonMinterAddress = Address.parse("EQA..."); // UPDATE THIS WITH YOUR DEPLOYED ADDRESS
    
    // Connect to the deployed jetton minter
    const jettonMinter = provider.open(JettonMinter.createFromAddress(jettonMinterAddress));

    // Updated jetton metadata - CHANGE THESE VALUES AS NEEDED
    const updatedParams = {
        name: "RezaToken",
        description: "RezaToken with $1 sell limit restriction",
        symbol: "RTZ",
        decimals: "9",
        image: "https://your-domain.com/path-to-your-logo.png", // UPDATE WITH YOUR ACTUAL LOGO URL
    };

    console.log('🔄 Updating jetton metadata...');
    console.log('📝 New metadata:');
    console.log('  Name:', updatedParams.name);
    console.log('  Symbol:', updatedParams.symbol);
    console.log('  Description:', updatedParams.description);
    console.log('  Decimals:', updatedParams.decimals);
    console.log('  Image:', updatedParams.image);

    // Create new TEP-64 compliant metadata
    const newContent = beginCell()
        .storeUint(0, 8) // onchain content tag
        .storeDict(
            Dictionary.empty(Dictionary.Keys.Buffer(32), Dictionary.Values.Cell())
                .set(sha256_sync("name"), beginCell().storeUint(0, 8).storeStringTail(updatedParams.name).endCell())
                .set(sha256_sync("symbol"), beginCell().storeUint(0, 8).storeStringTail(updatedParams.symbol).endCell())
                .set(sha256_sync("description"), beginCell().storeUint(0, 8).storeStringTail(updatedParams.description).endCell())
                .set(sha256_sync("decimals"), beginCell().storeUint(0, 8).storeStringTail(updatedParams.decimals).endCell())
                .set(sha256_sync("image"), beginCell().storeUint(0, 8).storeStringTail(updatedParams.image).endCell())
        )
        .endCell();

    // Send the update transaction
    await jettonMinter.sendChangeContent(provider.sender(), toNano('0.05'), newContent);

    console.log('✅ Metadata update transaction sent!');
    console.log('⏳ Wait for confirmation, then your new logo and metadata will be live.');
    
    // Verify the update
    console.log('\n🔍 Verifying update...');
    const jettonData = await jettonMinter.getJettonData();
    console.log('📊 Current jetton data:');
    console.log('  Total Supply:', jettonData.totalSupply.toString());
    console.log('  Admin:', jettonData.adminAddress);
    console.log('  Content updated:', jettonData.content.toString() !== '');
}