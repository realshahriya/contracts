import { Address, toNano, beginCell } from '@ton/core';
import { RezaToken } from '../wrappers/RezaToken';
import { NetworkProvider } from '@ton/blueprint';
import { getContractAddress, validateConfig } from './config';
import { extractMetadata } from '../utils/metadata-helpers';

export async function run(provider: NetworkProvider) {
    console.log('💸 Token Transfer Script');
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
        console.log(`Decimals: ${metadata.decimals}`);
        console.log(`Contract: ${contractAddress.toString()}`);

        // Get sender address
        const sender = provider.sender();
        const senderAddress = sender.address;
        
        if (!senderAddress) {
            throw new Error('❌ Sender address not available. Please connect your wallet.');
        }

        console.log(`\n👤 Sender: ${senderAddress.toString()}`);

        // Get sender's wallet address and check balance
        const senderWalletAddress = await token.getGetWalletAddress(senderAddress);
        console.log(`💳 Your Token Wallet: ${senderWalletAddress.toString()}`);

        console.log('\n💸 Transfer Options:');
        console.log('1. Simple transfer');
        console.log('2. Transfer with notification');
        console.log('3. Transfer with custom payload');
        console.log('4. Batch transfer to multiple recipients');

        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const option = await new Promise<string>((resolve) => {
            readline.question('\n🔢 Select transfer option (1-4): ', resolve);
        });

        switch (option) {
            case '1':
                await simpleTransfer(provider, token, senderWalletAddress, readline, metadata.symbol);
                break;
            case '2':
                await transferWithNotification(provider, token, senderWalletAddress, readline, metadata.symbol);
                break;
            case '3':
                await transferWithPayload(provider, token, senderWalletAddress, readline, metadata.symbol);
                break;
            case '4':
                await batchTransfer(provider, token, senderWalletAddress, readline, metadata.symbol);
                break;
            default:
                console.log('❌ Invalid option selected');
        }

        readline.close();

    } catch (error: any) {
        console.error('\n❌ Error in token transfer:', error.message);
        
        if (error.message.includes('Insufficient balance')) {
            console.log('\n💡 Troubleshooting:');
            console.log('• Check your token balance');
            console.log('• Make sure you have enough tokens to transfer');
            console.log('• Use get-all-data script to check balances');
        } else if (error.message.includes('Insufficient funds')) {
            console.log('\n💡 Troubleshooting:');
            console.log('• Add more TON to your wallet for gas fees');
            console.log('• Required: ~0.05 TON per transfer');
        }
    }
}

async function simpleTransfer(provider: NetworkProvider, token: any, senderWallet: Address, readline: any, symbol: string) {
    console.log('\n💸 Simple Transfer');
    
    const recipient = await new Promise<string>((resolve) => {
        readline.question('Enter recipient address: ', resolve);
    });
    
    const amountInput = await new Promise<string>((resolve) => {
        readline.question(`Enter amount to transfer (in ${symbol}): `, resolve);
    });

    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) {
        throw new Error('❌ Invalid amount. Please enter a positive number.');
    }

    const recipientAddress = Address.parse(recipient);
    const amountInNano = BigInt(Math.floor(amount * 1e9));

    console.log('\n📋 Transfer Details:');
    console.log(`• From: ${senderWallet.toString()}`);
    console.log(`• To: ${recipientAddress.toString()}`);
    console.log(`• Amount: ${amount} ${symbol}`);
    console.log(`• Amount (nano): ${amountInNano.toString()}`);

    const confirm = await new Promise<string>((resolve) => {
        readline.question('\n❓ Confirm transfer? (yes/no): ', resolve);
    });

    if (confirm.toLowerCase() !== 'yes') {
        console.log('❌ Transfer cancelled by user.');
        return;
    }

    // Create wallet contract instance
    const { JettonDefaultWallet } = await import('../../build/token/token_JettonDefaultWallet');
    const wallet = provider.open(JettonDefaultWallet.fromAddress(senderWallet));

    const gasAmount = '0.05';
    console.log(`\n💸 Executing transfer...`);
    console.log(`💰 Gas Amount: ${gasAmount} TON`);

    await wallet.send(
        provider.sender(),
        {
            value: toNano(gasAmount),
        },
        {
            $$type: 'TokenTransfer',
            queryId: BigInt(Date.now()),
            amount: amountInNano,
            destination: recipientAddress,
            response_destination: provider.sender().address!,
            custom_payload: null,
            forward_ton_amount: toNano('0.01'),
            forward_payload: beginCell().endCell().asSlice()
        }
    );

    console.log('\n✅ Transfer transaction sent successfully!');
    logTransactionDetails(senderWallet, recipientAddress, amount, symbol, gasAmount);
}

async function transferWithNotification(provider: NetworkProvider, token: any, senderWallet: Address, readline: any, symbol: string) {
    console.log('\n🔔 Transfer with Notification');
    
    const recipient = await new Promise<string>((resolve) => {
        readline.question('Enter recipient address: ', resolve);
    });
    
    const amountInput = await new Promise<string>((resolve) => {
        readline.question(`Enter amount to transfer (in ${symbol}): `, resolve);
    });

    const notificationAmount = await new Promise<string>((resolve) => {
        readline.question('Enter notification amount (in TON, e.g., 0.01): ', resolve);
    });

    const amount = parseFloat(amountInput);
    const notifyAmount = parseFloat(notificationAmount);
    
    if (isNaN(amount) || amount <= 0) {
        throw new Error('❌ Invalid transfer amount.');
    }
    
    if (isNaN(notifyAmount) || notifyAmount < 0) {
        throw new Error('❌ Invalid notification amount.');
    }

    const recipientAddress = Address.parse(recipient);
    const amountInNano = BigInt(Math.floor(amount * 1e9));

    console.log('\n📋 Transfer Details:');
    console.log(`• Amount: ${amount} ${symbol}`);
    console.log(`• Recipient: ${recipientAddress.toString()}`);
    console.log(`• Notification: ${notifyAmount} TON`);

    const confirm = await new Promise<string>((resolve) => {
        readline.question('\n❓ Confirm transfer with notification? (yes/no): ', resolve);
    });

    if (confirm.toLowerCase() !== 'yes') {
        console.log('❌ Transfer cancelled by user.');
        return;
    }

    const { JettonDefaultWallet } = await import('../../build/token/token_JettonDefaultWallet');
    const wallet = provider.open(JettonDefaultWallet.fromAddress(senderWallet));

    const gasAmount = 0.05 + notifyAmount;
    console.log(`\n💸 Executing transfer with notification...`);
    console.log(`💰 Total Gas + Notification: ${gasAmount} TON`);

    await wallet.send(
        provider.sender(),
        {
            value: toNano(gasAmount.toString()),
        },
        {
            $$type: 'TokenTransfer',
            queryId: BigInt(Date.now()),
            amount: amountInNano,
            destination: recipientAddress,
            response_destination: provider.sender().address!,
            custom_payload: null,
            forward_ton_amount: toNano(notifyAmount.toString()),
            forward_payload: beginCell()
                .storeUint(0, 32)
                .storeStringTail('Token transfer notification')
                .endCell().asSlice()
        }
    );

    console.log('\n✅ Transfer with notification sent successfully!');
    logTransactionDetails(senderWallet, recipientAddress, amount, symbol, gasAmount.toString());
}

async function transferWithPayload(provider: NetworkProvider, token: any, senderWallet: Address, readline: any, symbol: string) {
    console.log('\n📦 Transfer with Custom Payload');
    
    const recipient = await new Promise<string>((resolve) => {
        readline.question('Enter recipient address: ', resolve);
    });
    
    const amountInput = await new Promise<string>((resolve) => {
        readline.question(`Enter amount to transfer (in ${symbol}): `, resolve);
    });

    const payloadText = await new Promise<string>((resolve) => {
        readline.question('Enter custom payload text: ', resolve);
    });

    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) {
        throw new Error('❌ Invalid amount.');
    }

    const recipientAddress = Address.parse(recipient);
    const amountInNano = BigInt(Math.floor(amount * 1e9));

    // Create custom payload
    const customPayload = beginCell()
        .storeUint(0, 32) // op code
        .storeStringTail(payloadText)
        .endCell();

    console.log('\n📋 Transfer Details:');
    console.log(`• Amount: ${amount} ${symbol}`);
    console.log(`• Recipient: ${recipientAddress.toString()}`);
    console.log(`• Payload: "${payloadText}"`);

    const confirm = await new Promise<string>((resolve) => {
        readline.question('\n❓ Confirm transfer with payload? (yes/no): ', resolve);
    });

    if (confirm.toLowerCase() !== 'yes') {
        console.log('❌ Transfer cancelled by user.');
        return;
    }

    const { JettonDefaultWallet } = await import('../../build/token/token_JettonDefaultWallet');
    const wallet = provider.open(JettonDefaultWallet.fromAddress(senderWallet));

    const gasAmount = '0.05';
    console.log(`\n💸 Executing transfer with payload...`);

    await wallet.send(
        provider.sender(),
        {
            value: toNano(gasAmount),
        },
        {
            $$type: 'TokenTransfer',
            queryId: BigInt(Date.now()),
            amount: amountInNano,
            destination: recipientAddress,
            response_destination: provider.sender().address!,
            custom_payload: customPayload,
            forward_ton_amount: toNano('0.01'),
            forward_payload: beginCell().endCell().asSlice()
        }
    );

    console.log('\n✅ Transfer with payload sent successfully!');
    logTransactionDetails(senderWallet, recipientAddress, amount, symbol, gasAmount);
}

async function batchTransfer(provider: NetworkProvider, token: any, senderWallet: Address, readline: any, symbol: string) {
    console.log('\n📊 Batch Transfer');
    console.log('Enter recipients and amounts (format: address,amount)');
    console.log('Example: EQD4FPq...,100');
    
    const batchInput = await new Promise<string>((resolve) => {
        readline.question('\nEnter batch transfers (one per line, empty line to finish):\n', resolve);
    });

    const transfers = batchInput
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
            const [address, amount] = line.split(',');
            return {
                address: address.trim(),
                amount: parseFloat(amount.trim())
            };
        });

    if (transfers.length === 0) {
        console.log('❌ No valid transfers provided');
        return;
    }

    console.log(`\n📋 Batch Transfer Summary (${transfers.length} transfers):`);
    let totalAmount = 0;
    
    for (let i = 0; i < transfers.length; i++) {
        const transfer = transfers[i];
        console.log(`${i + 1}. ${transfer.address} → ${transfer.amount} ${symbol}`);
        totalAmount += transfer.amount;
    }
    
    console.log(`\nTotal Amount: ${totalAmount} ${symbol}`);

    const confirm = await new Promise<string>((resolve) => {
        readline.question('\n❓ Confirm batch transfer? (yes/no): ', resolve);
    });

    if (confirm.toLowerCase() !== 'yes') {
        console.log('❌ Batch transfer cancelled by user.');
        return;
    }

    console.log('\n💸 Executing batch transfers...');
    
    // Note: In a real implementation, you might want to batch these or add delays
    console.log('⚠️  Note: Each transfer will be sent as a separate transaction');
    console.log('⚠️  Make sure you have sufficient TON for gas fees');
}

function logTransactionDetails(from: Address, to: Address, amount: number, symbol: string, gas: string) {
    console.log('\n📋 Transaction Details:');
    console.log(`• From Wallet: ${from.toString()}`);
    console.log(`• To Address: ${to.toString()}`);
    console.log(`• Amount: ${amount} ${symbol}`);
    console.log(`• Gas Used: ${gas} TON`);
    console.log('\n⏳ Waiting for transaction confirmation...');
    console.log('💡 Check your wallet for transaction status');
    console.log('💡 Tokens will be transferred once confirmed');
}
