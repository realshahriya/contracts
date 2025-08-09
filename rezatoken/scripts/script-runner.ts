import { Address, toNano } from '@ton/core';
import { RezaToken } from '../wrappers/RezaToken';
import { NetworkProvider } from '@ton/blueprint';
import * as readline from 'readline';
import { getContractAddress, getDefaultGas, validateConfig } from './config';
import { extractMetadata } from '../utils/metadata-helpers';

// Available deployed contract addresses (fallback if env not configured)
const DEPLOYED_CONTRACTS = {
    'mainnet': 'kQCr3sfrMtkAHdzWGXvYg3qJNrfNcZQ8UHSeNCE6Er8Q-KbS',
    'testnet': 'EQD4FPq-aQiCeldHFflo_VWJyUGsHx7ntbvvLT5YW7Oe_-Hi',
    // Add more contract addresses as needed
};

interface ScriptOption {
    id: string;
    name: string;
    description: string;
    action: (provider: NetworkProvider, token: any) => Promise<void>;
}

export async function run(provider: NetworkProvider) {
    console.log('🚀 RezaToken Contract Script Runner');
    console.log('='.repeat(50));
    
    // Try to use environment configuration first, fallback to manual selection
    let contractAddress: Address;
    try {
        validateConfig();
        contractAddress = getContractAddress();
        console.log('✅ Using contract address from environment configuration');
    } catch (error) {
        console.log('⚠️ Environment configuration not found, using manual selection');
        contractAddress = await selectContractAddress();
    }
    
    const token = provider.open(RezaToken.fromAddress(contractAddress));
    console.log(`\n📍 Using contract: ${contractAddress.toString()}`);
    
    // Define available scripts
    const scripts: ScriptOption[] = [
        {
            id: '1',
            name: 'Check Contract State',
            description: 'View all contract information, token data, and current settings',
            action: checkContractState
        },
        {
            id: '2',
            name: 'Test Transaction Limits',
            description: 'Manage and test dynamic transaction limit features',
            action: testTransactionLimits
        },
        {
            id: '3',
            name: 'Test Address Exclusions',
            description: 'Manage excluded addresses (DEX, whales, partners)',
            action: testAddressExclusions
        },
        {
            id: '4',
            name: 'Mint Tokens',
            description: 'Mint new tokens (owner only)',
            action: mintTokens
        },
        {
            id: '5',
            name: 'Transfer Tokens',
            description: 'Transfer tokens to another address',
            action: transferTokens
        },
        {
            id: '6',
            name: 'Check Wallet Balance',
            description: 'Check token balance for any address',
            action: checkWalletBalance
        },
        {
            id: '7',
            name: 'Pause/Unpause Contract',
            description: 'Toggle contract pause state (owner only)',
            action: togglePauseState
        },
        {
            id: '8',
            name: 'Update Content',
            description: 'Update token metadata content (owner only)',
            action: updateContent
        },
        {
            id: '9',
            name: 'Transfer Ownership',
            description: 'Transfer contract ownership (current owner only)',
            action: transferOwnership
        }
    ];
    
    while (true) {
        console.log('\n📋 Available Scripts:');
        console.log('='.repeat(30));
        
        scripts.forEach(script => {
            console.log(`${script.id}. ${script.name}`);
            console.log(`   ${script.description}`);
        });
        
        console.log('0. Exit');
        
        const choice = await getUserInput('\n🔢 Select a script to run (0-9): ');
        
        if (choice === '0') {
            console.log('👋 Goodbye!');
            break;
        }
        
        const selectedScript = scripts.find(s => s.id === choice);
        
        if (selectedScript) {
            console.log(`\n🎯 Running: ${selectedScript.name}`);
            console.log('='.repeat(50));
            
            try {
                await selectedScript.action(provider, token);
                console.log('\n✅ Script completed successfully!');
            } catch (error) {
                console.error('\n❌ Script failed:', error);
            }
            
            await getUserInput('\n⏸️  Press Enter to continue...');
        } else {
            console.log('❌ Invalid choice. Please try again.');
        }
    }
}

async function selectContractAddress(): Promise<Address> {
    console.log('\n🌐 Select Contract Network:');
    console.log('1. Environment (.env file)');
    console.log('2. Mainnet');
    console.log('3. Testnet');
    console.log('4. Custom Address');
    
    const choice = await getUserInput('Choose option (1-4): ');
    
    switch (choice) {
        case '1':
            try {
                return getContractAddress();
            } catch (error) {
                console.log('❌ Environment configuration error:', error);
                console.log('Falling back to testnet...');
                return Address.parse(DEPLOYED_CONTRACTS.testnet);
            }
        case '2':
            return Address.parse(DEPLOYED_CONTRACTS.mainnet);
        case '3':
            return Address.parse(DEPLOYED_CONTRACTS.testnet);
        case '4':
            const customAddress = await getUserInput('Enter contract address: ');
            return Address.parse(customAddress);
        default:
            console.log('Invalid choice, using testnet...');
            return Address.parse(DEPLOYED_CONTRACTS.testnet);
    }
}

async function checkContractState(provider: NetworkProvider, token: any): Promise<void> {
    console.log("🔍 Checking RezaToken Contract State");
    
    try {
        console.log("\n📊 Basic Token Information:");
        
        // Get basic token data
        const jettonData = await token.getGetJettonData();
        console.log("Total Supply:", jettonData.totalSupply.toString());
        console.log("Total Supply (RTZ):", (Number(jettonData.totalSupply) / 1e9).toFixed(2));
        console.log("Mintable:", jettonData.mintable);
        console.log("Owner:", jettonData.owner.toString());
        
        // Get token metadata
        const metadata = extractMetadata(jettonData.content);
        console.log("Name:", metadata.name);
        console.log("Symbol:", metadata.symbol);
        console.log("Decimals:", metadata.decimals);
        
        console.log("\n🛡️ Transaction Limits:");
        console.log("Transaction Limits: Not implemented in basic contract");
        
        console.log("\n👤 Owner Status:");
        const owner = jettonData.owner;
        console.log("Owner Exclusions: Not implemented in basic contract");
        
    } catch (error) {
        console.error("❌ Error checking contract state:", error);
    }
}

async function testTransactionLimits(provider: NetworkProvider, token: any): Promise<void> {
    console.log("🔧 Transaction Limit Management");
    console.log("❌ Transaction limits are not implemented in this basic contract");
    console.log("This contract focuses on standard Jetton functionality only");
}

async function testAddressExclusions(provider: NetworkProvider, token: any): Promise<void> {
    console.log("🏪 Address Exclusion Management");
    console.log("❌ Address exclusions are not implemented in this basic contract");
    console.log("This contract focuses on standard Jetton functionality only");
}

async function mintTokens(provider: NetworkProvider, token: any): Promise<void> {
    console.log("💰 Mint New Tokens");
    
    const recipient = await getUserInput('Enter recipient address: ');
    const amount = await getUserInput('Enter amount to mint (in RTZ): ');
    
    console.log('Minting tokens...');
    await token.send(
        provider.sender(),
        { value: getDefaultGas() },
        {
            $$type: 'Mint',
            to: Address.parse(recipient),
            amount: toNano(amount)
        }
    );
    
    console.log('✅ Mint transaction sent');
}

async function transferTokens(provider: NetworkProvider, token: any): Promise<void> {
    console.log("💸 Transfer Tokens");
    
    const recipient = await getUserInput('Enter recipient address: ');
    const amount = await getUserInput('Enter amount to transfer (in RTZ): ');
    
    // Get sender's wallet address first
    const senderAddress = provider.sender().address;
    if (!senderAddress) {
        throw new Error('Sender address not available');
    }
    
    const senderWallet = await token.getGetWalletAddress(senderAddress);
    
    console.log('Transferring tokens...');
    // Note: This would require implementing the wallet transfer logic
    console.log('⚠️  Transfer functionality requires wallet contract interaction');
    console.log(`Sender wallet: ${senderWallet.toString()}`);
    console.log(`Recipient: ${recipient}`);
    console.log(`Amount: ${amount} RTZ`);
}

async function checkWalletBalance(provider: NetworkProvider, token: any): Promise<void> {
    console.log("💳 Check Wallet Balance");
    
    const address = await getUserInput('Enter wallet address: ');
    const walletAddress = await token.getGetWalletAddress(Address.parse(address));
    
    console.log(`Wallet contract address: ${walletAddress.toString()}`);
    console.log('⚠️  Balance checking requires wallet contract interaction');
}

async function togglePauseState(provider: NetworkProvider, token: any): Promise<void> {
    console.log("⏸️  Toggle Pause State");
    console.log('⚠️  Pause functionality not implemented in current contract');
}

async function updateContent(provider: NetworkProvider, token: any): Promise<void> {
    console.log("📝 Update Token Content");
    console.log('⚠️  Content update functionality requires metadata preparation');
}

async function transferOwnership(provider: NetworkProvider, token: any): Promise<void> {
    console.log("👑 Transfer Contract Ownership");
    
    try {
        // Get current owner
        const currentOwner = await token.getOwner();
        const senderAddress = provider.sender().address;
        
        if (!senderAddress) {
            throw new Error('Sender address not available');
        }
        
        console.log(`Current Owner: ${currentOwner.toString()}`);
        console.log(`Your Address: ${senderAddress.toString()}`);
        
        // Verify sender is current owner
        if (!currentOwner.equals(senderAddress)) {
            console.log('❌ ERROR: You are not the current owner!');
            console.log('Only the current owner can transfer ownership.');
            return;
        }
        
        const newOwnerInput = await getUserInput('Enter new owner address: ');
        const newOwner = Address.parse(newOwnerInput);
        
        // Verify new owner is different
        if (currentOwner.equals(newOwner)) {
            console.log('❌ ERROR: New owner is the same as current owner!');
            return;
        }
        
        console.log(`\n📋 Transfer Details:`);
        console.log(`From: ${currentOwner.toString()}`);
        console.log(`To: ${newOwner.toString()}`);
        
        const confirmation = await getUserInput('\n⚠️  WARNING: This is IRREVERSIBLE! Type "CONFIRM" to proceed: ');
        
        if (confirmation !== 'CONFIRM') {
            console.log('❌ Transfer cancelled.');
            return;
        }
        
        console.log('🚀 Transferring ownership...');
        
        await token.send(
            provider.sender(),
            { value: getDefaultGas() },
            {
                $$type: 'ChangeOwner',
                queryId: BigInt(Date.now()),
                newOwner: newOwner
            }
        );
        
        console.log('✅ Ownership transfer transaction sent!');
        console.log('⏳ Waiting for confirmation...');
        
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Verify transfer
        const updatedOwner = await token.getOwner();
        if (updatedOwner.equals(newOwner)) {
            console.log('🎉 SUCCESS: Ownership transferred!');
            console.log(`New owner: ${updatedOwner.toString()}`);
        } else {
            console.log('⚠️  Transfer may still be processing...');
            console.log('Please check again in a few minutes.');
        }
        
    } catch (error) {
        console.error('❌ Error transferring ownership:', error);
        
        if (error instanceof Error) {
            if (error.message.includes('Not Owner')) {
                console.log('💡 You are not the current owner of this contract.');
            } else if (error.message.includes('Invalid address')) {
                console.log('💡 The provided address format is invalid.');
            }
        }
    }
}

function getUserInput(prompt: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}
