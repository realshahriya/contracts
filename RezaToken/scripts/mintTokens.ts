import { toNano, Address } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { RezaTokenMinter } from '../build/RezaTokenMinter_RezaTokenMinter';

export async function run(provider: NetworkProvider, args: string[]) {
    console.log('🪙 Minting RezaTokens...\n');

    // Get RezaTokenMinter contract address
    let minterAddress: Address;
    
    if (args.length > 0) {
        minterAddress = Address.parse(args[0]);
    } else {
        const addressInput = await provider.ui().input('Enter RezaTokenMinter contract address:');
        minterAddress = Address.parse(addressInput);
    }

    // Get receiver address
    const receiverInput = await provider.ui().input('Enter receiver address (or press Enter for your address):');
    const receiverAddress = receiverInput.trim() 
        ? Address.parse(receiverInput) 
        : provider.sender().address!;

    // Get amount to mint
    const amountInput = await provider.ui().input('Enter amount to mint (in RTZ, e.g., 100.5):');
    const amountRtz = parseFloat(amountInput);
    
    if (isNaN(amountRtz) || amountRtz <= 0) {
        throw new Error('Invalid amount. Please enter a positive number.');
    }

    // Convert to nanoRTZ (RTZ * 1e18)
    const amountNano = toNano(amountRtz.toString());

    console.log('📋 Minting Configuration:');
    console.log(`Minter Address: ${minterAddress.toString()}`);
    console.log(`Receiver: ${receiverAddress.toString()}`);
    console.log(`Amount: ${amountRtz} RTZ`);
    console.log(`Amount (nano): ${amountNano.toString()} nanoRTZ`);
    console.log('');

    // Confirm minting
    const confirmMessage = `Mint ${amountRtz} RTZ tokens to ${receiverAddress.toString()}?`;
    const response = await provider.ui().input(confirmMessage + ' (y/n):');
    const confirmed = response.toLowerCase() === 'y';
    
    if (!confirmed) {
        console.log('❌ Minting cancelled.');
        return;
    }

    try {
        // Open RezaTokenMinter contract
        const minter = provider.open(
            RezaTokenMinter.fromAddress(minterAddress)
        );

        // Check if minting is still enabled
        const jettonData = await minter.getGetJettonData();
        
        if (!jettonData.mintable) {
            throw new Error('Minting has been permanently disabled for this contract.');
        }

        // Verify ownership
        const senderAddress = provider.sender().address!;
        if (!jettonData.adminAddress.equals(senderAddress)) {
            throw new Error(`You are not the owner of this contract. Owner: ${jettonData.adminAddress.toString()}`);
        }

        console.log('📊 Current Contract State:');
        console.log(`Total Supply: ${jettonData.totalSupply.toString()} nanoRTZ`);
        console.log(`Mintable: ${jettonData.mintable}`);
        console.log('');

        // Send mint message
        console.log('📤 Sending mint transaction...');
        await minter.send(
            provider.sender(),
            { value: toNano('0.1') }, // Gas for minting
            {
                $$type: 'Mint',
                amount: amountNano,
                receiver: receiverAddress,
            }
        );

        console.log('⏳ Waiting for transaction confirmation...');
        
        // Wait for transaction to be processed
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Get updated data
        const updatedData = await minter.getGetJettonData();
        const walletAddress = await minter.getGetWalletAddress(receiverAddress);

        console.log('\n✅ Minting successful!');
        console.log(`Minted: ${amountRtz} RTZ`);
        console.log(`New Total Supply: ${updatedData.totalSupply.toString()} nanoRTZ`);
        console.log(`Receiver Wallet: ${walletAddress.toString()}`);
        console.log(`Transaction Explorer: https://${provider.network() === 'testnet' ? 'testnet.' : ''}tonscan.org/address/${minterAddress.toString()}`);

        console.log('\n📝 Next Steps:');
        console.log('- Check wallet balance using checkBalance script');
        console.log('- Test token transfers');
        console.log('- Set up sale approvals if needed');

    } catch (error) {
        console.error('❌ Minting failed:', error);
        throw error;
    }
}