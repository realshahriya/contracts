import { Address } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { CustomJettonWallet } from '../build/RezaTokenMinter_CustomJettonWallet';
import { RezaTokenMinter } from '../build/RezaTokenMinter_RezaTokenMinter';

export async function run(provider: NetworkProvider, args: string[]) {
    console.log('💰 Checking RezaToken Balance...\n');

    let walletAddress: Address;
    let minterAddress: Address | null = null;

    if (args.length > 0) {
        // If wallet address is provided directly
        walletAddress = Address.parse(args[0]);
    } else {
        // Ask for minter address and user address to calculate wallet
        const minterInput = await provider.ui().input('Enter RezaTokenMinter contract address:');
        minterAddress = Address.parse(minterInput);

        const userInput = await provider.ui().input('Enter user address (or press Enter for your address):');
        const userAddress = userInput.trim() 
            ? Address.parse(userInput) 
            : provider.sender().address!;

        // Get wallet address from minter
        const minter = provider.open(
            RezaTokenMinter.fromAddress(minterAddress)
        );
        
        walletAddress = await minter.getGetWalletAddress(userAddress);
        console.log(`Calculated wallet address: ${walletAddress.toString()}`);
    }

    console.log('📋 Balance Check Configuration:');
    console.log(`Wallet Address: ${walletAddress.toString()}`);
    if (minterAddress) {
        console.log(`Minter Address: ${minterAddress.toString()}`);
    }
    console.log('');

    try {
        // Open wallet contract
        const wallet = provider.open(
            CustomJettonWallet.fromAddress(walletAddress)
        );

        console.log('📊 Fetching wallet data...');
        
        // Get wallet data
        const walletData = await wallet.getGetWalletData();
        
        // Convert balance from nanoRTZ to RTZ
        const balanceRtz = Number(walletData.balance) / 1e18;

        console.log('\n💰 Wallet Information:');
        console.log('======================');
        console.log(`Owner: ${walletData.owner.toString()}`);
        console.log(`Jetton Minter: ${walletData.jetton.toString()}`);
        console.log(`Balance: ${balanceRtz.toFixed(6)} RTZ`);
        console.log(`Balance (nano): ${walletData.balance.toString()} nanoRTZ`);

        // If we have minter address, get additional info
        if (minterAddress) {
            console.log('\n📊 Additional Token Information:');
            console.log('================================');
            
            const minter = provider.open(
                RezaTokenMinter.fromAddress(minterAddress)
            );
            
            const jettonData = await minter.getGetJettonData();
            const totalSupplyRtz = Number(jettonData.totalSupply) / 1e18;
            const ownershipPercentage = totalSupplyRtz > 0 ? (balanceRtz / totalSupplyRtz) * 100 : 0;

            console.log(`Token Name: RezaToken (RTZ)`);
            console.log(`Total Supply: ${totalSupplyRtz.toFixed(6)} RTZ`);
            console.log(`Your Share: ${ownershipPercentage.toFixed(4)}%`);
            console.log(`Mintable: ${jettonData.mintable}`);
            console.log(`Admin: ${jettonData.adminAddress.toString()}`);
        }

        console.log(`\n🔗 Explorer Links:`);
        const explorerBase = provider.network() === 'testnet' ? 'testnet.tonscan.org' : 'tonscan.org';
        console.log(`Wallet: https://${explorerBase}/address/${walletAddress.toString()}`);
        if (minterAddress) {
            console.log(`Minter: https://${explorerBase}/address/${minterAddress.toString()}`);
        }

        // Show balance status
        if (balanceRtz === 0) {
            console.log('\n⚠️  This wallet has no RTZ tokens.');
            console.log('💡 To get tokens:');
            console.log('   - Ask the contract owner to mint tokens to your address');
            console.log('   - Receive tokens from another wallet');
        } else {
            console.log(`\n✅ Wallet has ${balanceRtz.toFixed(6)} RTZ tokens`);
        }

    } catch (error) {
        console.error('❌ Balance check failed:', error);
        
        // Check if wallet exists
        if (error instanceof Error && error.message.includes('exit_code')) {
            console.log('\n💡 This wallet may not exist yet.');
            console.log('   Jetton wallets are created automatically when tokens are first received.');
        }
        
        throw error;
    }
}