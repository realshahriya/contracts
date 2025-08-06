import { NetworkProvider } from '@ton/blueprint';
import { Address } from '@ton/core';

export async function run(provider: NetworkProvider) {
    console.log('🔍 Checking wallet balance...\n');
    
    // Get wallet address
    const walletAddress = provider.sender().address;
    if (!walletAddress) {
        console.log('❌ Could not get wallet address');
        return;
    }
    
    console.log(`📍 Wallet Address: ${walletAddress.toString()}`);
    console.log(`🔗 Testnet Explorer: https://testnet.tonscan.org/address/${walletAddress.toString()}\n`);
    
    console.log('💰 Wallet Information:');
    console.log('   This is your test wallet for deployment');
    console.log('   Make sure it has sufficient testnet TON for deployment\n');
    
    console.log('📝 To get testnet TON:');
    console.log('   1. Visit: https://testnet.tonhub.com/');
    console.log('   2. Or visit: https://t.me/testgiver_ton_bot');
    console.log(`   3. Send your wallet address: ${walletAddress.toString()}`);
    console.log('   4. Wait for the transaction to confirm');
    console.log('   5. Check balance on explorer before deploying\n');
    
    console.log('💡 Deployment Requirements:');
    console.log('   - Minimum: 0.5 TON for deployment');
    console.log('   - Recommended: 1.0 TON for multiple operations');
    console.log('   - Each contract deployment costs ~0.05-0.1 TON');
    
    console.log('\n🚀 Once funded, run: npm run start');
}