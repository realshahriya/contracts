import { Address } from '@ton/core';
import { JettonMinter } from '../wrappers/JettonMinter';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    // Your deployed jetton minter address
    const jettonMinterAddress = Address.parse("EQCZWjA-D6bW5n1AwIuMXl-m9coXxo7QmRDs3a8z_vD-TbzJ");
    
    // New admin address for testing (replace with actual address)
    const newAdminAddress = Address.parse("UQCdUuB9giaYrcH3e1dueLiAgqvL2Z9lo5Fgp5umFgFQII3N"); // UPDATE THIS WITH TEST ADDRESS
    
    console.log('🧪 Testing Ownership Transfer for RezaToken...\n');
    
    try {
        // Connect to the deployed jetton minter
        const jettonMinter = provider.open(JettonMinter.createFromAddress(jettonMinterAddress));

        // STEP 1: Check current ownership
        console.log('📋 STEP 1: Checking current ownership...');
        const initialData = await jettonMinter.getJettonData();
        console.log('├─ Current owner:', initialData.adminAddress.toString());
        console.log('├─ Your address:', provider.sender().address?.toString());
        console.log('└─ You are owner:', initialData.adminAddress.equals(provider.sender().address!) ? '✅ YES' : '❌ NO');
        
        if (!initialData.adminAddress.equals(provider.sender().address!)) {
            console.log('\n❌ ERROR: You are not the current owner! Cannot proceed with test.');
            return;
        }
        
        // STEP 2: Perform ownership transfer
        console.log('\n📋 STEP 2: Transferring ownership...');
        console.log('├─ From:', initialData.adminAddress.toString());
        console.log('├─ To:', newAdminAddress.toString());
        console.log('└─ Sending transaction...');
        
        await jettonMinter.sendChangeAdmin(provider.sender(), newAdminAddress);
        console.log('✅ Transfer transaction sent!');
        
        // STEP 3: Wait and verify
        console.log('\n📋 STEP 3: Waiting for confirmation...');
        console.log('⏳ Waiting 15 seconds for blockchain confirmation...');
        
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        // STEP 4: Check new ownership
        console.log('\n📋 STEP 4: Verifying ownership change...');
        const updatedData = await jettonMinter.getJettonData();
        console.log('├─ Previous owner:', initialData.adminAddress.toString());
        console.log('├─ Current owner:', updatedData.adminAddress.toString());
        console.log('├─ Expected owner:', newAdminAddress.toString());
        
        // Verify the change
        const transferSuccessful = updatedData.adminAddress.equals(newAdminAddress);
        const ownershipChanged = !updatedData.adminAddress.equals(initialData.adminAddress);
        
        console.log('\n🎯 TEST RESULTS:');
        console.log('├─ Ownership changed:', ownershipChanged ? '✅ YES' : '❌ NO');
        console.log('├─ Transfer successful:', transferSuccessful ? '✅ YES' : '❌ NO');
        console.log('├─ You lost admin rights:', !updatedData.adminAddress.equals(provider.sender().address!) ? '✅ YES' : '❌ NO');
        console.log('└─ New owner correct:', transferSuccessful ? '✅ YES' : '❌ NO');
        
        if (transferSuccessful) {
            console.log('\n🎉 SUCCESS: Ownership transfer completed successfully!');
            console.log('⚠️  WARNING: You no longer have admin privileges for this contract.');
        } else {
            console.log('\n⏳ PENDING: Transfer may still be processing. Check again in a few minutes.');
        }
        
    } catch (error) {
        console.log('\n❌ Error during ownership transfer test:');
        console.log('Error:', error);
    }
}