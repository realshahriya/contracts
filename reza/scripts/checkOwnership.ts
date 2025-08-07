import { Address } from '@ton/core';
import { JettonMinter } from '../wrappers/JettonMinter';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    // Your deployed jetton minter address
    const jettonMinterAddress = Address.parse("EQCZWjA-D6bW5n1AwIuMXl-m9coXxo7QmRDs3a8z_vD-TbzJ");
    
    console.log('🔍 Checking RezaToken Ownership & Contract Details...\n');
    console.log('📍 Contract Address:', jettonMinterAddress.toString());
    console.log('🌐 Network:', provider.network());
    
    try {
        // Connect to the deployed jetton minter
        const jettonMinter = provider.open(JettonMinter.createFromAddress(jettonMinterAddress));

        // Get current jetton data
        console.log('\n📊 Fetching contract data...');
        const jettonData = await jettonMinter.getJettonData();
        
        // Display ownership information
        console.log('\n👑 OWNERSHIP INFORMATION:');
        console.log('├─ Current Admin/Owner:', jettonData.adminAddress.toString());
        console.log('├─ Your Address:', provider.sender().address?.toString());
        console.log('└─ You are the owner:', jettonData.adminAddress.equals(provider.sender().address!) ? '✅ YES' : '❌ NO');
        
        // Display token information
        console.log('\n🪙 TOKEN INFORMATION:');
        console.log('├─ Total Supply:', jettonData.totalSupply.toString());
        console.log('├─ Mintable:', jettonData.mintable ? '✅ YES' : '❌ NO');
        console.log('└─ Wallet Code Hash:', jettonData.walletCode.hash().toString('hex').substring(0, 16) + '...');
        
        // Get sell limit
        const sellLimit = await jettonMinter.getSellLimit();
        console.log('\n💰 SELL LIMIT:');
        console.log('└─ Current Limit:', sellLimit.toString(), 'nanotons');
        
        // Parse and display metadata
        console.log('\n📝 METADATA:');
        try {
            const contentSlice = jettonData.content.beginParse();
            const prefix = contentSlice.loadUint(8);
            
            if (prefix === 0) {
                console.log('├─ Type: On-chain metadata (TEP-64)');
                console.log('└─ Content Hash:', jettonData.content.hash().toString('hex').substring(0, 32) + '...');
            } else if (prefix === 1) {
                console.log('├─ Type: Off-chain metadata (URL)');
                try {
                    const url = contentSlice.loadStringTail();
                    console.log('└─ Metadata URL:', url);
                } catch {
                    console.log('└─ Content Hash:', jettonData.content.hash().toString('hex').substring(0, 32) + '...');
                }
            } else {
                console.log('├─ Type: Unknown metadata format');
                console.log('└─ Content Hash:', jettonData.content.hash().toString('hex').substring(0, 32) + '...');
            }
        } catch (error) {
            console.log('├─ Metadata parsing failed');
            console.log('└─ Raw content hash:', jettonData.content.hash().toString('hex').substring(0, 32) + '...');
        }
        
        // Check if user can perform admin actions
        console.log('\n🔐 ADMIN PRIVILEGES:');
        const isAdmin = jettonData.adminAddress.equals(provider.sender().address!);
        console.log('├─ Can mint tokens:', isAdmin ? '✅ YES' : '❌ NO');
        console.log('├─ Can change metadata:', isAdmin ? '✅ YES' : '❌ NO');
        console.log('├─ Can transfer ownership:', isAdmin ? '✅ YES' : '❌ NO');
        console.log('├─ Can change sell limit:', isAdmin ? '✅ YES' : '❌ NO');
        console.log('└─ Can approve large sells:', isAdmin ? '✅ YES' : '❌ NO');
        
        console.log('\n✅ Ownership check completed successfully!');
        
    } catch (error) {
        console.log('\n❌ Error checking ownership:');
        console.log('Error:', error);
        console.log('\nPossible reasons:');
        console.log('- Contract address is incorrect');
        console.log('- Contract is not deployed');
        console.log('- Network connection issues');
    }
}