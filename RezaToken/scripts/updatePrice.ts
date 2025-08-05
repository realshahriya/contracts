import { toNano, Address } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { PriceFeed } from '../build/PriceFeed_PriceFeed';

export async function run(provider: NetworkProvider, args: string[]) {
    console.log('📊 Updating TON/USD Price Feed...\n');

    // Get PriceFeed contract address
    let priceFeedAddress: Address;
    
    if (args.length > 0) {
        priceFeedAddress = Address.parse(args[0]);
    } else {
        const addressInput = await provider.ui().input('Enter PriceFeed contract address:');
        priceFeedAddress = Address.parse(addressInput);
    }

    // Get new price
    const priceInput = await provider.ui().input('Enter new TON/USD price (e.g., 2.50 for $2.50):');
    const priceUsd = parseFloat(priceInput);
    
    if (isNaN(priceUsd) || priceUsd <= 0) {
        throw new Error('Invalid price. Please enter a positive number.');
    }

    // Convert to contract format (USD * 1e6)
    const tonUsdRate = Math.floor(priceUsd * 1000000);

    console.log('📋 Update Configuration:');
    console.log(`PriceFeed Address: ${priceFeedAddress.toString()}`);
    console.log(`New Price: $${priceUsd.toFixed(2)} per TON`);
    console.log(`Contract Value: ${tonUsdRate}`);
    console.log('');

    // Confirm update
    const confirmMessage = `Update TON/USD rate to $${priceUsd.toFixed(2)}?`;
    const confirmInput = await provider.ui().input(`${confirmMessage} (y/n):`);
    const confirmed = confirmInput.toLowerCase() === 'y';
    
    if (!confirmed) {
        console.log('❌ Update cancelled.');
        return;
    }

    try {
        // Open PriceFeed contract
        const priceFeed = provider.open(
            PriceFeed.fromAddress(priceFeedAddress)
        );

        // Verify ownership
        const owner = await priceFeed.getOwner();
        const senderAddress = provider.sender().address!;
        
        if (!owner.equals(senderAddress)) {
            throw new Error(`You are not the owner of this PriceFeed contract. Owner: ${owner.toString()}`);
        }

        // Send update message
        console.log('📤 Sending price update...');
        await priceFeed.send(
            provider.sender(),
            { value: toNano('0.05') },
            {
                $$type: 'UpdatePrice',
                tonUsdRate: BigInt(tonUsdRate),
            }
        );

        console.log('⏳ Waiting for transaction confirmation...');
        
        // Wait a bit for the transaction to be processed
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Verify the update
        const newRate = await priceFeed.getGetTonUsdRate();
        const newPriceUsd = Number(newRate) / 1000000;

        console.log('\n✅ Price update successful!');
        console.log(`New TON/USD Rate: $${newPriceUsd.toFixed(2)}`);
        console.log(`Transaction Explorer: https://${provider.network() === 'testnet' ? 'testnet.' : ''}tonscan.org/address/${priceFeedAddress.toString()}`);

    } catch (error) {
        console.error('❌ Price update failed:', error);
        throw error;
    }
}