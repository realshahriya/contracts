import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano, beginCell, Dictionary } from '@ton/core';
import { JettonMinter } from './wrappers/JettonMinter';
import { JettonWallet } from './wrappers/JettonWallet';
import { sha256_sync } from '@ton/crypto';
import { compile } from '@ton/blueprint';

async function debugMinting() {
    console.log('🔍 Starting debug test...');
    
    const minterCode = await compile('JettonMinter');
    const walletCode = await compile('JettonWallet');
    
    const blockchain = await Blockchain.create();
    const deployer = await blockchain.treasury('deployer');
    const user = await blockchain.treasury('user');
    
    console.log('📝 Deployer address:', deployer.address.toString());
    console.log('👤 User address:', user.address.toString());
    
    // Create proper TEP-64 compliant metadata using dictionary format
    const jettonContent = beginCell()
        .storeUint(0, 8) // onchain content tag
        .storeDict(
            Dictionary.empty(Dictionary.Keys.Buffer(32), Dictionary.Values.Cell())
                .set(sha256_sync("name"), beginCell().storeUint(0, 8).storeStringTail("Reza Token").endCell())
                .set(sha256_sync("symbol"), beginCell().storeUint(0, 8).storeStringTail("REZA").endCell())
                .set(sha256_sync("description"), beginCell().storeUint(0, 8).storeStringTail("Reza Token - A sample jetton implementation").endCell())
                .set(sha256_sync("decimals"), beginCell().storeUint(0, 8).storeStringTail("9").endCell())
        )
        .endCell();

    const jettonMinter = blockchain.openContract(JettonMinter.createFromConfig({
        admin: deployer.address,
        content: jettonContent,
        wallet_code: walletCode,
        sell_limit: toNano('1'),
    }, minterCode));

    console.log('🏭 Minter address:', jettonMinter.address.toString());

    // Deploy minter
    const deployResult = await jettonMinter.sendDeploy(deployer.getSender(), toNano('0.05'));
    console.log('✅ Minter deployed, transactions:', deployResult.transactions.length);

    // Get wallet address before minting
    const walletAddress = await jettonMinter.getWalletAddress(user.address);
    console.log('💼 Expected wallet address:', walletAddress.toString());
    
    const userWallet = blockchain.openContract(JettonWallet.createFromAddress(walletAddress));

    // Try to get wallet data before minting (should fail or return zeros)
    try {
        const walletDataBefore = await userWallet.getWalletData();
        console.log('💰 Wallet balance before minting:', walletDataBefore.balance.toString());
    } catch (e: any) {
        console.log('❌ Wallet not deployed yet (expected):', e.message);
    }

    // Mint tokens
    console.log('🪙 Minting 1000 tokens...');
    const mintResult = await jettonMinter.sendMint(deployer.getSender(), {
        to: user.address,
        jetton_amount: toNano('1000'),
        forward_ton_amount: toNano('0.05'), // Back to original amount
        total_ton_amount: toNano('0.1'),
    });

    console.log('📊 Mint transactions:', mintResult.transactions.length);
    console.log('💰 Total TON amount sent:', toNano('0.1'));
    console.log('🔄 Forward TON amount:', toNano('0.05'));
    
    // Print all transactions with detailed info
    mintResult.transactions.forEach((tx, i) => {
        const computePhase = tx.description.type === 'generic' ? tx.description.computePhase : null;
        const success = computePhase?.type === 'vm' ? computePhase.success : false;
        const exitCode = computePhase?.type === 'vm' ? computePhase.exitCode : 'N/A';
        
        const txDetails = {
            from: tx.inMessage?.info.type === 'internal' ? tx.inMessage?.info.src?.toString() : 'external',
            to: tx.inMessage?.info.dest?.toString(),
            success: tx.description.type === 'generic' ? tx.description.computePhase.type === 'vm' && tx.description.computePhase.success : false,
            exitCode: tx.description.type === 'generic' && tx.description.computePhase.type === 'vm' ? tx.description.computePhase.exitCode : 'N/A',
            value: tx.inMessage?.info.type === 'internal' ? tx.inMessage.info.value.coins : 'external',
            actionPhase: tx.description.type === 'generic' ? tx.description.actionPhase : null
        };
        console.log(`Transaction ${i}:`, txDetails);
        
        // If this is the wallet transaction, let's see if it has any outgoing messages
        if (tx.inMessage?.info?.dest?.toString() === walletAddress.toString()) {
            console.log(`  Wallet transaction details:`, {
                outMessagesCount: tx.outMessages.size,
                gasUsed: computePhase?.type === 'vm' ? computePhase.gasUsed : 'N/A'
            });
        }
    });

    // Check minter total supply
    const jettonData = await jettonMinter.getJettonData();
    console.log('🏭 Minter total supply:', jettonData.totalSupply.toString());

    // Check wallet data after minting
    try {
        const walletDataAfter = await userWallet.getWalletData();
        console.log('💰 Wallet balance after minting:', walletDataAfter.balance.toString());
        console.log('👤 Wallet owner:', walletDataAfter.owner.toString());
        console.log('🏭 Wallet jetton master:', walletDataAfter.jetton.toString());
        console.log('🔒 Wallet sell limit:', walletDataAfter.sellLimit.toString());
        
        // Let's also verify the addresses match what we expect
        console.log('🔍 Address verification:');
        console.log('  Expected owner:', user.address.toString());
        console.log('  Actual owner:', walletDataAfter.owner.toString());
        console.log('  Expected minter:', jettonMinter.address.toString());
        console.log('  Actual minter:', walletDataAfter.jetton.toString());
        console.log('  Addresses match:', 
            walletDataAfter.owner.equals(user.address) && 
            walletDataAfter.jetton.equals(jettonMinter.address)
        );
    } catch (e: any) {
        console.log('❌ Error getting wallet data:', e.message);
    }
}

debugMinting().catch(console.error);