import { toNano, Address } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { RezaTokenMinter } from '../build/RezaTokenMinter_RezaTokenMinter';

export async function run(provider: NetworkProvider, args: string[]) {
    console.log('✅ Approving Sale for User...\n');

    // Get RezaTokenMinter contract address
    let minterAddress: Address;
    
    if (args.length > 0) {
        minterAddress = Address.parse(args[0]);
    } else {
        const addressInput = await provider.ui().input('Enter RezaTokenMinter contract address:');
        minterAddress = Address.parse(addressInput);
    }

    // Get user address to approve
    const userAddressInput = await provider.ui().input('Enter user address to approve:');
    const userAddress = Address.parse(userAddressInput);

    // Get approval amount in USD
    const amountInput = await provider.ui().input('Enter approval amount in USD (e.g., 100.50):');
    const amountUsd = parseFloat(amountInput);
    
    if (isNaN(amountUsd) || amountUsd <= 0) {
        throw new Error('Invalid amount. Please enter a positive number.');
    }

    // Convert to contract format (USD * 1e6)
    const amountUsdContract = Math.floor(amountUsd * 1000000);

    console.log('📋 Sale Approval Configuration:');
    console.log(`Minter Address: ${minterAddress.toString()}`);
    console.log(`User Address: ${userAddress.toString()}`);
    console.log(`Approval Amount: $${amountUsd.toFixed(2)} USD`);
    console.log(`Contract Value: ${amountUsdContract}`);
    console.log('');

    // Confirm approval
    const confirmMessage = `Approve $${amountUsd.toFixed(2)} USD worth of token sales for user ${userAddress.toString()}?`;
    const confirmInput = await provider.ui().input(`${confirmMessage} (y/n):`);
    const confirmed = confirmInput.toLowerCase() === 'y';
    
    if (!confirmed) {
        console.log('❌ Approval cancelled.');
        return;
    }

    try {
        // Open RezaTokenMinter contract
        const minter = provider.open(
            RezaTokenMinter.fromAddress(minterAddress)
        );

        // Verify ownership
        const jettonData = await minter.getGetJettonData();
        const senderAddress = provider.sender().address!;
        
        if (!jettonData.adminAddress.equals(senderAddress)) {
            throw new Error(`You are not the owner of this RezaTokenMinter contract. Owner: ${jettonData.adminAddress.toString()}`);
        }

        // Send approval message
        console.log('📤 Sending sale approval...');
        await minter.send(
            provider.sender(),
            { value: toNano('0.05') },
            {
                $$type: 'ApproveSale',
                user: userAddress,
                amountUsd: BigInt(amountUsdContract),
            }
        );

        console.log('⏳ Waiting for transaction confirmation...');
        
        // Wait for transaction to be processed
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('\n✅ Sale approval successful!');
        console.log(`User ${userAddress.toString()} can now sell up to $${amountUsd.toFixed(2)} USD worth of RTZ tokens`);
        console.log(`Transaction Explorer: https://${provider.network() === 'testnet' ? 'testnet.' : ''}tonscan.org/address/${minterAddress.toString()}`);

        console.log('\n📝 Notes:');
        console.log('- This approval is cumulative and will be reduced as the user makes sales');
        console.log('- Sales under $1 USD do not require approval');
        console.log('- The user can make multiple sales until the approved amount is exhausted');

    } catch (error) {
        console.error('❌ Sale approval failed:', error);
        throw error;
    }
}