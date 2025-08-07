import { toNano, Address } from '@ton/core';
import { JettonMinter } from '../wrappers/JettonMinter';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    // Replace with your deployed jetton minter address
    const jettonMinterAddress = Address.parse("EQCZWjA-D6bW5n1AwIuMXl-m9coXxo7QmRDs3a8z_vD-TbzJ"); // UPDATE THIS WITH YOUR DEPLOYED ADDRESS
    
    // Replace with the new admin/owner address
    const newAdminAddress = Address.parse("UQCdUuB9giaYrcH3e1dueLiAgqvL2Z9lo5Fgp5umFgFQII3N"); // UPDATE THIS WITH NEW OWNER ADDRESS
    
    console.log('🔄 Transferring ownership of RezaToken...');
    console.log('📍 Current contract address:', jettonMinterAddress.toString());
    console.log('👤 Current admin (you):', provider.sender().address?.toString());
    console.log('🎯 New admin address:', newAdminAddress.toString());
    
    // Connect to the deployed jetton minter
    const jettonMinter = provider.open(JettonMinter.createFromAddress(jettonMinterAddress));

    // Get current jetton data to verify current admin
    console.log('\n🔍 Verifying current ownership...');
    const jettonData = await jettonMinter.getJettonData();
    console.log('📊 Current admin:', jettonData.adminAddress.toString());
    
    // Check if the sender is the current admin
    if (!jettonData.adminAddress.equals(provider.sender().address!)) {
        console.log('❌ ERROR: You are not the current admin of this contract!');
        console.log('   Current admin:', jettonData.adminAddress.toString());
        console.log('   Your address:', provider.sender().address?.toString());
        return;
    }

    // Confirm the transfer
    console.log('\n⚠️  WARNING: This action is IRREVERSIBLE!');
    console.log('   Once you transfer ownership, you will lose all admin privileges.');
    console.log('   The new owner will be able to:');
    console.log('   - Mint new tokens');
    console.log('   - Change contract metadata');
    console.log('   - Modify sell limits');
    console.log('   - Approve large sells');
    console.log('   - Transfer ownership again');
    
    // Send the ownership transfer transaction
    console.log('\n🚀 Sending ownership transfer transaction...');
    await jettonMinter.sendChangeAdmin(provider.sender(), newAdminAddress);

    console.log('✅ Ownership transfer transaction sent!');
    console.log('⏳ Wait for confirmation, then verify the new ownership.');
    
    // Wait a moment and verify the change
    console.log('\n🔍 Verifying ownership transfer...');
    console.log('   (Note: It may take a few seconds for the change to be reflected)');
    
    setTimeout(async () => {
        try {
            const updatedJettonData = await jettonMinter.getJettonData();
            console.log('📊 Updated admin:', updatedJettonData.adminAddress.toString());
            
            if (updatedJettonData.adminAddress.equals(newAdminAddress)) {
                console.log('🎉 SUCCESS: Ownership successfully transferred!');
                console.log('   New owner:', newAdminAddress.toString());
            } else {
                console.log('⏳ Transfer pending... Check again in a few moments.');
            }
        } catch (error) {
            console.log('⏳ Verification pending... Check manually on explorer.');
        }
    }, 10000); // Wait 10 seconds before verification
}