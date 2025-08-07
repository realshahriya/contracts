import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano, beginCell } from '@ton/core';
import { JettonWallet } from '../wrappers/JettonWallet';
import { JettonMinter } from '../wrappers/JettonMinter';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('JettonWallet', () => {
    let minterCode: Cell;
    let walletCode: Cell;

    beforeAll(async () => {
        minterCode = await compile('JettonMinter');
        walletCode = await compile('JettonWallet');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let user1: SandboxContract<TreasuryContract>;
    let user2: SandboxContract<TreasuryContract>;
    let jettonMinter: SandboxContract<JettonMinter>;
    let user1Wallet: SandboxContract<JettonWallet>;
    let user2Wallet: SandboxContract<JettonWallet>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');
        user1 = await blockchain.treasury('user1');
        user2 = await blockchain.treasury('user2');

        const jettonContent = beginCell()
            .storeUint(0, 8)
            .storeStringTail("Reza Token")
            .storeStringTail("REZA")
            .storeStringTail("Reza Token - A sample jetton implementation")
            .storeStringTail("18")
            .endCell();

        jettonMinter = blockchain.openContract(JettonMinter.createFromConfig({
            admin: deployer.address,
            content: jettonContent,
            wallet_code: walletCode,
            sell_limit: toNano('1'), // $1 sell limit
        }, minterCode));

        await jettonMinter.sendDeploy(deployer.getSender(), toNano('0.05'));

        // Mint tokens to user1
        await jettonMinter.sendMint(deployer.getSender(), {
            to: user1.address,
            jetton_amount: toNano('1000'),
            forward_ton_amount: toNano('0.05'),
            total_ton_amount: toNano('0.1'),
        });

        const user1WalletAddress = await jettonMinter.getWalletAddress(user1.address);
        const user2WalletAddress = await jettonMinter.getWalletAddress(user2.address);

        user1Wallet = blockchain.openContract(JettonWallet.createFromAddress(user1WalletAddress));
        user2Wallet = blockchain.openContract(JettonWallet.createFromAddress(user2WalletAddress));
    });

    it('should have correct wallet data', async () => {
        const walletData = await user1Wallet.getWalletData();
        
        expect(walletData.balance).toEqual(toNano('1000'));
        expect(walletData.owner.equals(user1.address)).toBeTruthy();
        expect(walletData.jetton.equals(jettonMinter.address)).toBeTruthy();
    });

    it('should transfer tokens', async () => {
        const transferAmount = toNano('0.5'); // Below the 1 TON sell limit
        
        const transferResult = await user1Wallet.sendTransfer(user1.getSender(), {
            value: toNano('0.1'),
            to: user2.address,
            jettonAmount: transferAmount,
            fwdAmount: toNano('0.05'),
        });

        expect(transferResult.transactions).toHaveTransaction({
            from: user1.address,
            to: user1Wallet.address,
            success: true,
        });

        // Check balances
        const user1Data = await user1Wallet.getWalletData();
        const user2Data = await user2Wallet.getWalletData();

        expect(user1Data.balance).toEqual(toNano('999.5'));
        expect(user2Data.balance).toEqual(toNano('0.5'));
    });

    it('should burn tokens', async () => {
        const burnAmount = toNano('0.5');
        
        const burnResult = await user1Wallet.sendBurn(user1.getSender(), {
            value: toNano('0.1'),
            jettonAmount: burnAmount,
        });

        expect(burnResult.transactions).toHaveTransaction({
            from: user1.address,
            to: user1Wallet.address,
            success: true,
        });

        // Check balance and total supply
        const user1Data = await user1Wallet.getWalletData();
        const jettonData = await jettonMinter.getJettonData();

        expect(user1Data.balance).toEqual(toNano('999.5'));
        expect(jettonData.totalSupply).toEqual(toNano('999.5'));
    });

    it('should fail transfer with insufficient balance', async () => {
        // First burn most tokens to create insufficient balance scenario
        await user1Wallet.sendBurn(user1.getSender(), {
            value: toNano('0.1'),
            jettonAmount: toNano('0.9'),
        });
        
        const transferAmount = toNano('0.5'); // More than remaining balance (0.1)
        
        const transferResult = await user1Wallet.sendTransfer(user1.getSender(), {
            value: toNano('0.1'),
            to: user2.address,
            jettonAmount: transferAmount,
            fwdAmount: toNano('0.05'),
        });

        expect(transferResult.transactions).toHaveTransaction({
            from: user1.address,
            to: user1Wallet.address,
            success: false,
        });
    });

    it('should fail transfer from wrong owner', async () => {
        const transferAmount = toNano('100');
        
        const transferResult = await user1Wallet.sendTransfer(user2.getSender(), {
            value: toNano('0.1'),
            to: user2.address,
            jettonAmount: transferAmount,
            fwdAmount: toNano('0.05'),
        });

        expect(transferResult.transactions).toHaveTransaction({
            from: user2.address,
            to: user1Wallet.address,
            success: false,
        });
    });

    it('should restrict sells above $1 limit', async () => {
        // Try to transfer more than the sell limit (1 TON = $1 approximation)
        const sellAmount = toNano('2'); // 2 TON > 1 TON limit
        
        const result = await user1Wallet.sendTransfer(user1.getSender(), {
            value: toNano('0.1'),
            to: user2.address,
            jettonAmount: sellAmount,
            fwdAmount: toNano('0.01'),
        });

        expect(result.transactions).toHaveTransaction({
            from: user1.address,
            to: user1Wallet.address,
            success: false,
            exitCode: 710, // sell limit exceeded
        });
    });

    it('should allow sells below $1 limit', async () => {
        // Transfer amount below the sell limit
        const sellAmount = toNano('0.5'); // 0.5 TON < 1 TON limit
        
        const result = await user1Wallet.sendTransfer(user1.getSender(), {
            value: toNano('0.1'),
            to: user2.address,
            jettonAmount: sellAmount,
            fwdAmount: toNano('0.01'),
        });

        expect(result.transactions).toHaveTransaction({
            from: user1.address,
            to: user1Wallet.address,
            success: true,
        });
    });
});