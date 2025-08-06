import { mnemonicNew, mnemonicToWalletKey } from '@ton/crypto';
import { WalletContractV4 } from '@ton/ton';
import { Address } from '@ton/core';

async function generateWallet() {
    console.log('🔑 Generating new wallet...\n');
    
    // Generate new mnemonic
    const mnemonic = await mnemonicNew(24);
    console.log('📝 Mnemonic (save this securely):');
    console.log(mnemonic.join(' '));
    console.log('\n⚠️  IMPORTANT: Save this mnemonic phrase securely! You will need it for deployment.\n');
    
    // Generate wallet key pair
    const keyPair = await mnemonicToWalletKey(mnemonic);
    
    // Create wallet contract
    const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
    
    console.log('📍 Wallet Address (Testnet):', wallet.address.toString());
    console.log('📍 Wallet Address (Mainnet):', wallet.address.toString());
    
    console.log('\n📋 Environment Configuration:');
    console.log('Add this to your .env file:');
    console.log('WALLET_MNEMONIC="' + mnemonic.join(' ') + '"');
    console.log('WALLET_VERSION=v4R2');
    
    console.log('\n💰 Next Steps:');
    console.log('1. Add testnet TON to this address: https://t.me/testgiver_ton_bot');
    console.log('2. Update your .env file with the mnemonic above');
    console.log('3. Run: npm run start');
}

generateWallet().catch(console.error);