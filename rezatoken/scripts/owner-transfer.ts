import { Address, toNano } from '@ton/core';
import { Token } from '../wrappers/token';
import { NetworkProvider } from '@ton/blueprint';
import { getContractAddress, getDefaultGas, validateConfig, debugLog } from './config';

export async function run(provider: NetworkProvider) {
    console.log('👑 Owner Transfer Script');
    console.log('='.repeat(50));

    // Validate configuration and get contract address from environment
    validateConfig();
    const contractAddress = getContractAddress();
    const token = provider.open(Token.fromAddress(contractAddress));

    try {
        // Get current contract state
        console.log('\n📊 Current Contract State:');
        const jettonData = await token.getGetJettonData();
        const currentOwner = await token.getOwner();
        const symbol = await token.getGetSymbol();
        const name = await token.getGetName();
        
        console.log(`Token: ${name} (${symbol})`);
        console.log(`Contract: ${contractAddress.toString()}`);
        console.log(`Current Owner: ${currentOwner.toString()}`);
        console.log(`Total Supply: ${jettonData.totalSupply.toString()}`);
        console.log(`Mintable: ${jettonData.mintable ? '✅ Yes' : '❌ No'}`);

        // Verify sender is current owner
        const senderAddress = provider.sender().address;
        if (!senderAddress) {
            throw new Error('❌ Sender address not available');
        }

        const isCurrentOwner = currentOwner.equals(senderAddress);
        console.log(`\n👤 Sender Verification:`);
        console.log(`Your Address: ${senderAddress.toString()}`);
        console.log(`Is Current Owner: ${isCurrentOwner ? '✅ Yes' : '❌ No'}`);

        if (!isCurrentOwner) {
            console.log('\n❌ ERROR: You are not the current owner of this contract!');
            console.log('Only the current owner can transfer ownership.');
            console.log(`Current owner: ${currentOwner.toString()}`);
            console.log(`Your address: ${senderAddress.toString()}`);
            return;
        }

        // Get new owner address
        console.log('\n🔄 Ownership Transfer');
        console.log('='.repeat(30));
        
        // Interactive mode for getting new owner address
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const question = (query: string): Promise<string> => {
            return new Promise(resolve => rl.question(query, resolve));
        };

        let newOwnerAddress: Address;
        
        try {
            const newOwnerInput = await question('Enter new owner address: ');
            newOwnerAddress = Address.parse(newOwnerInput.trim());
            
            console.log(`\n📋 Transfer Details:`);
            console.log(`From: ${currentOwner.toString()}`);
            console.log(`To: ${newOwnerAddress.toString()}`);
            
            // Verify the new owner address is different
            if (currentOwner.equals(newOwnerAddress)) {
                console.log('\n❌ ERROR: New owner address is the same as current owner!');
                rl.close();
                return;
            }

            // Confirmation prompt
            const confirmation = await question('\n⚠️  WARNING: This action is IRREVERSIBLE!\nAre you sure you want to transfer ownership? (yes/no): ');
            
            if (confirmation.toLowerCase() !== 'yes') {
                console.log('\n❌ Ownership transfer cancelled.');
                rl.close();
                return;
            }

            // Final confirmation with address verification
            console.log('\n🔍 Final Verification:');
            console.log(`Current Owner: ${currentOwner.toString()}`);
            console.log(`New Owner: ${newOwnerAddress.toString()}`);
            
            const finalConfirm = await question('\nType "TRANSFER" to confirm ownership transfer: ');
            
            if (finalConfirm !== 'TRANSFER') {
                console.log('\n❌ Ownership transfer cancelled.');
                rl.close();
                return;
            }

        } finally {
            rl.close();
        }

        // Generate unique query ID
        const queryId = BigInt(Date.now());
        
        console.log('\n🚀 Executing Ownership Transfer...');
        console.log(`Query ID: ${queryId}`);
        
        debugLog('Sending ChangeOwner message', {
            queryId: queryId.toString(),
            newOwner: newOwnerAddress.toString(),
            gas: getDefaultGas().toString()
        });

        // Send ChangeOwner message
        const transferResult = await token.send(
            provider.sender(),
            { 
                value: getDefaultGas(),
                bounce: true 
            },
            {
                $$type: 'ChangeOwner',
                queryId: queryId,
                newOwner: newOwnerAddress
            }
        );

        console.log('\n✅ Ownership transfer transaction sent!');
        console.log(`Transaction Hash: ${transferResult}`);
        
        // Wait for transaction confirmation
        console.log('\n⏳ Waiting for transaction confirmation...');
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

        // Verify ownership transfer
        console.log('\n🔍 Verifying ownership transfer...');
        try {
            const updatedOwner = await token.getOwner();
            
            if (updatedOwner.equals(newOwnerAddress)) {
                console.log('\n🎉 SUCCESS: Ownership transfer completed!');
                console.log(`✅ New owner: ${updatedOwner.toString()}`);
                console.log(`✅ Previous owner: ${currentOwner.toString()}`);
                
                // Display important notes
                console.log('\n📝 Important Notes:');
                console.log('• The new owner now has full control of the contract');
                console.log('• The new owner can mint tokens, change settings, and transfer ownership again');
                console.log('• The previous owner no longer has any control over the contract');
                console.log('• Make sure the new owner has access to their wallet and understands their responsibilities');
                
            } else {
                console.log('\n⚠️  WARNING: Ownership may not have transferred yet');
                console.log(`Current owner in contract: ${updatedOwner.toString()}`);
                console.log(`Expected new owner: ${newOwnerAddress.toString()}`);
                console.log('This could be due to:');
                console.log('• Transaction still processing');
                console.log('• Insufficient gas fees');
                console.log('• Network congestion');
                console.log('\nPlease check the transaction status and try verifying again in a few minutes.');
            }
        } catch (verifyError) {
            console.log('\n⚠️  Could not verify ownership transfer immediately');
            console.log('This might be normal if the transaction is still processing.');
            console.log('Please check the contract state in a few minutes.');
            console.log(`Error: ${verifyError}`);
        }

        // Display next steps
        console.log('\n📋 Next Steps for New Owner:');
        console.log('1. Verify you can access the contract with your wallet');
        console.log('2. Test basic owner functions (like checking contract state)');
        console.log('3. Update your environment configuration with the new owner address');
        console.log('4. Ensure you have backup access to your wallet');
        console.log('5. Review all contract functions and their purposes');

    } catch (error) {
        console.error('\n❌ Error during ownership transfer:', error);
        
        if (error instanceof Error) {
            if (error.message.includes('Not Owner')) {
                console.log('\n💡 This error means you are not the current owner of the contract.');
                console.log('Only the current contract owner can transfer ownership.');
            } else if (error.message.includes('Invalid address')) {
                console.log('\n💡 The provided address format is invalid.');
                console.log('Please ensure you enter a valid TON address.');
            } else if (error.message.includes('insufficient funds')) {
                console.log('\n💡 Insufficient funds for transaction.');
                console.log(`Required gas: ${getDefaultGas()} TON`);
            }
        }
        
        console.log('\n🔧 Troubleshooting:');
        console.log('• Verify you are the current contract owner');
        console.log('• Check your wallet balance for gas fees');
        console.log('• Ensure the new owner address is valid and different from current owner');
        console.log('• Try again with a higher gas fee if the transaction failed');
    }
}

// Utility function for standalone execution
export async function transferOwnership(
    provider: NetworkProvider, 
    contractAddress: Address, 
    newOwnerAddress: Address
): Promise<boolean> {
    try {
        const token = provider.open(Token.fromAddress(contractAddress));
        const queryId = BigInt(Date.now());
        
        await token.send(
            provider.sender(),
            { 
                value: getDefaultGas(),
                bounce: true 
            },
            {
                $$type: 'ChangeOwner',
                queryId: queryId,
                newOwner: newOwnerAddress
            }
        );
        
        // Wait and verify
        await new Promise(resolve => setTimeout(resolve, 10000));
        const updatedOwner = await token.getOwner();
        
        return updatedOwner.equals(newOwnerAddress);
    } catch (error) {
        console.error('Transfer ownership error:', error);
        return false;
    }
}

// Emergency ownership recovery function (for documentation purposes)
export function displayEmergencyRecoveryInfo() {
    console.log('\n🆘 Emergency Ownership Recovery Information');
    console.log('='.repeat(50));
    console.log('If you lose access to the owner wallet:');
    console.log('');
    console.log('❌ IMPORTANT: There is NO built-in recovery mechanism!');
    console.log('');
    console.log('Prevention measures:');
    console.log('• Always backup your wallet seed phrase securely');
    console.log('• Test wallet access before transferring large amounts');
    console.log('• Consider using a multi-signature wallet for important contracts');
    console.log('• Keep multiple secure backups of wallet credentials');
    console.log('');
    console.log('If ownership is lost:');
    console.log('• The contract will continue to function for existing token holders');
    console.log('• No new tokens can be minted (if minting was enabled)');
    console.log('• Contract settings cannot be changed');
    console.log('• Ownership cannot be recovered without the original owner wallet');
}