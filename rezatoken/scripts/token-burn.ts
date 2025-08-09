import { Address, toNano } from '@ton/core';
import { RezaToken } from '../wrappers/RezaToken';
import { NetworkProvider } from '@ton/blueprint';
import { extractMetadata, formatTokenAmount } from '../utils/metadata-helpers';
import { getContractAddress, validateConfig } from './config';

export async function run(provider: NetworkProvider) {
    console.log('🔥 Token Burn Script - RTZ Token');
    console.log('='.repeat(50));

    // Validate configuration and get contract address
    validateConfig();
    const contractAddress = getContractAddress();
    const token = provider.open(RezaToken.fromAddress(contractAddress));

    try {
        // Get token info
        console.log('\n📊 Token Information:');
        const jettonData = await token.getGetJettonData();
        const metadata = extractMetadata(jettonData.content);
        
        console.log(`Token: ${metadata.name} (${metadata.symbol})`);
        console.log(`Total Supply: ${formatTokenAmount(jettonData.totalSupply, metadata.decimals)} ${metadata.symbol}`);
        console.log(`Contract: ${contractAddress.toString()}`);

        // Get sender address
        const sender = provider.sender();
        const senderAddress = sender.address;
        
        if (!senderAddress) {
            throw new Error('❌ Sender address not available. Please connect your wallet.');
        }

        console.log(`\n👤 Sender: ${senderAddress.toString()}`);

        // Get sender's wallet address
        const senderWalletAddress = await token.getGetWalletAddress(senderAddress);
        console.log(`💳 Your Token Wallet: ${senderWalletAddress.toString()}`);

        console.log('\n🔥 Burn Options:');
        console.log('1. Burn specific amount');
        console.log('2. Burn all tokens');
        console.log('3. Burn with custom response destination');

        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const option = await new Promise<string>((resolve) => {
            readline.question('\n🔢 Select burn option (1-3): ', (answer: string) => resolve(answer));
        });

        switch (option) {
            case '1':
                await burnSpecificAmount(provider, senderWalletAddress, readline, metadata.symbol);
                break;
            case '2':
                await burnAllTokens(provider, senderWalletAddress, readline, metadata.symbol);
                break;
            case '3':
                await burnWithCustomDestination(provider, senderWalletAddress, readline, metadata.symbol);
                break;
            default:
                console.log('❌ Invalid option selected');
        }

        readline.close();

    } catch (error: any) {
        console.error('\n❌ Error in token burn:', error.message);
        
        if (error.message.includes('Insufficient balance')) {
            console.log('\n💡 Troubleshooting:');
            console.log('• Check your token balance');
            console.log('• Make sure you have enough tokens to burn');
            console.log('• Use wallet-operations script to check balance');
        } else if (error.message.includes('Insufficient funds')) {
            console.log('\n💡 Troubleshooting:');
            console.log('• Add more TON to your wallet for gas fees');
            console.log(`• Required: ~0.05 TON`);
        }
    }
}

async function burnSpecificAmount(provider: NetworkProvider, senderWallet: Address, readline: any, symbol: string) {
    console.log('\n🔥 Burn Specific Amount');
    
    const amountInput = await new Promise<string>((resolve) => {
        readline.question(`Enter amount to burn (in ${symbol}): `, (answer: string) => resolve(answer));
    });

    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) {
        throw new Error('❌ Invalid amount. Please enter a positive number.');
    }

    const amountInNano = BigInt(Math.floor(amount * 1e9));

    console.log('\n📋 Burn Details:');
    console.log(`• Wallet: ${senderWallet.toString()}`);
    console.log(`• Amount: ${amount} ${symbol}`);
    console.log(`• Amount (nano): ${amountInNano.toString()}`);
    console.log(`• Response to: ${provider.sender().address!.toString()}`);

    console.log('\n⚠️  WARNING: Token burning is irreversible!');
    console.log('⚠️  Burned tokens will be permanently removed from circulation!');

    const confirm = await new Promise<string>((resolve) => {
        readline.question('\n❓ Confirm burn operation? (yes/no): ', (answer: string) => resolve(answer));
    });

    if (confirm.toLowerCase() !== 'yes') {
        console.log('❌ Burn operation cancelled by user.');
        return;
    }

    await executeBurn(provider, senderWallet, amountInNano, provider.sender().address!, amount, symbol);
}

async function burnAllTokens(provider: NetworkProvider, senderWallet: Address, readline: any, symbol: string) {
    console.log('\n🔥 Burn All Tokens');
    console.log('⚠️  This will burn ALL your tokens!');
    
    // Note: In a real implementation, you'd need to get the current balance first
    console.log('\n⚠️  WARNING: This will burn ALL tokens in your wallet!');
    console.log('⚠️  This action is irreversible!');

    const confirm1 = await new Promise<string>((resolve) => {
        readline.question('\n❓ Are you sure you want to burn ALL tokens? (yes/no): ', (answer: string) => resolve(answer));
    });

    if (confirm1.toLowerCase() !== 'yes') {
        console.log('❌ Burn operation cancelled by user.');
        return;
    }

    const confirm2 = await new Promise<string>((resolve) => {
        readline.question('\n❓ Final confirmation - burn ALL tokens? (BURN ALL/no): ', (answer: string) => resolve(answer));
    });

    if (confirm2 !== 'BURN ALL') {
        console.log('❌ Burn operation cancelled by user.');
        return;
    }

    // For demonstration, we'll ask for the amount since we can't easily get balance here
    const amountInput = await new Promise<string>((resolve) => {
        readline.question(`Enter your current balance to burn (in ${symbol}): `, (answer: string) => resolve(answer));
    });

    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) {
        throw new Error('❌ Invalid amount.');
    }

    const amountInNano = BigInt(Math.floor(amount * 1e9));
    
    console.log('\n📋 Burn All Details:');
    console.log(`• Wallet: ${senderWallet.toString()}`);
    console.log(`• Amount: ${amount} ${symbol} (ALL TOKENS)`);

    await executeBurn(provider, senderWallet, amountInNano, provider.sender().address!, amount, symbol);
}

async function burnWithCustomDestination(provider: NetworkProvider, senderWallet: Address, readline: any, symbol: string) {
    console.log('\n🔥 Burn with Custom Response Destination');
    
    const amountInput = await new Promise<string>((resolve) => {
        readline.question(`Enter amount to burn (in ${symbol}): `, (answer: string) => resolve(answer));
    });

    const destinationInput = await new Promise<string>((resolve) => {
        readline.question('Enter response destination address: ', (answer: string) => resolve(answer));
    });

    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) {
        throw new Error('❌ Invalid amount.');
    }

    const amountInNano = BigInt(Math.floor(amount * 1e9));
    const responseDestination = Address.parse(destinationInput);

    console.log('\n📋 Burn Details:');
    console.log(`• Wallet: ${senderWallet.toString()}`);
    console.log(`• Amount: ${amount} ${symbol}`);
    console.log(`• Response to: ${responseDestination.toString()}`);

    const confirm = await new Promise<string>((resolve) => {
        readline.question('\n❓ Confirm burn with custom destination? (yes/no): ', (answer: string) => resolve(answer));
    });

    if (confirm.toLowerCase() !== 'yes') {
        console.log('❌ Burn operation cancelled by user.');
        return;
    }

    await executeBurn(provider, senderWallet, amountInNano, responseDestination, amount, symbol);
}

async function executeBurn(
    provider: NetworkProvider, 
    walletAddress: Address, 
    amount: bigint, 
    responseDestination: Address,
    displayAmount: number,
    symbol: string
) {
    try {
        // Create wallet contract instance
        const { JettonDefaultWallet } = await import('../../build/token/token_JettonDefaultWallet');
        const wallet = provider.open(JettonDefaultWallet.fromAddress(walletAddress));

        const gasAmount = '0.05';
        console.log(`\n🔥 Executing burn operation...`);
        console.log(`💰 Gas Amount: ${gasAmount} TON`);

        await wallet.send(
            provider.sender(),
            {
                value: toNano(gasAmount),
            },
            {
                $$type: 'TokenBurn',
                queryId: BigInt(Date.now()),
                amount: amount,
                owner: provider.sender().address!,
                response_destination: responseDestination
            }
        );

        console.log('\n✅ Burn transaction sent successfully!');
        console.log('\n📋 Transaction Details:');
        console.log(`• Action: Burn Tokens`);
        console.log(`• Wallet: ${walletAddress.toString()}`);
        console.log(`• Amount: ${displayAmount} ${symbol}`);
        console.log(`• Amount (nano): ${amount.toString()}`);
        console.log(`• Response to: ${responseDestination.toString()}`);
        console.log(`• Gas Used: ${gasAmount} TON`);

        console.log('\n⏳ Waiting for transaction confirmation...');
        console.log('💡 Check your wallet for transaction status');
        console.log('💡 Tokens will be burned once the transaction is confirmed');
        console.log('💡 Total supply will be reduced by the burned amount');

        console.log('\n🔥 Burn Process:');
        console.log('1. TokenBurn message sent to your wallet');
        console.log('2. Wallet validates and reduces balance');
        console.log('3. TokenBurnNotification sent to master contract');
        console.log('4. Master contract reduces total supply');
        console.log('5. Excess TON returned to response destination');

        console.log('\n💡 After Burn:');
        console.log('• Your token balance will be reduced');
        console.log('• Total token supply will be reduced');
        console.log('• Burned tokens are permanently removed');
        console.log('• Use get-all-data script to verify new supply');

    } catch (error: any) {
        console.error('\n❌ Error executing burn:', error.message);
        throw error;
    }
}
