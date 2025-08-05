import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano, beginCell, Address } from '@ton/core';
import { RezaTokenMinter } from '../build/RezaTokenMinter_RezaTokenMinter';
import { CustomJettonWallet } from '../build/RezaTokenMinter_CustomJettonWallet';
import { PriceFeed } from '../build/PriceFeed_PriceFeed';
import { expect } from '@jest/globals';

describe('RezaToken', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let user1: SandboxContract<TreasuryContract>;
    let user2: SandboxContract<TreasuryContract>;
    let rezaTokenMinter: SandboxContract<RezaTokenMinter>;
    let priceFeed: SandboxContract<PriceFeed>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        user1 = await blockchain.treasury('user1');
        user2 = await blockchain.treasury('user2');

        // Deploy PriceFeed first
        priceFeed = blockchain.openContract(
            await PriceFeed.fromInit(deployer.address)
        );

        const priceFeedDeployResult = await priceFeed.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'Deploy',
                queryId: BigInt(0),
            }
        );
        expect(priceFeedDeployResult.transactions[0]).toMatchObject({
            from: deployer.address,
            to: priceFeed.address,
            isDeployed: true,
            success: true,
        });

        // Create simple content for testing
        const content = beginCell()
            .storeUint(0, 8)
            .storeStringTail('RezaToken Test')
            .endCell();

        // Deploy RezaTokenMinter
        rezaTokenMinter = blockchain.openContract(
            await RezaTokenMinter.fromInit(
                deployer.address,
                content,
                priceFeed.address
            )
        );

        const deployResult = await rezaTokenMinter.send(
            deployer.getSender(),
            { value: toNano('0.1') },
            {
                $$type: 'Deploy',
                queryId: BigInt(0),
            }
        );
        expect(deployResult.transactions[0]).toMatchObject({
            from: deployer.address,
            to: rezaTokenMinter.address,
            isDeployed: true,
            success: true,
        });
    });

    it('should deploy correctly', async () => {
        const jettonData = await rezaTokenMinter.getGetJettonData();
        expect(jettonData.totalSupply).toBe(BigInt(0));
        expect(jettonData.mintable).toBe(true);
        expect(jettonData.adminAddress.toString()).toBe(deployer.address.toString());
    });

    it('should mint tokens correctly', async () => {
        const mintAmount = toNano('100');
        
        const mintResult = await rezaTokenMinter.send(
            deployer.getSender(),
            { value: toNano('0.1') },
            {
                $$type: 'Mint',
                amount: mintAmount,
                receiver: user1.address,
            }
        );

        expect(mintResult.transactions[0]).toMatchObject({
            from: deployer.address,
            to: rezaTokenMinter.address,
            success: true,
        });

        const jettonData = await rezaTokenMinter.getGetJettonData();
        expect(jettonData.totalSupply).toBe(mintAmount);

        // Check user wallet
        const walletAddress = await rezaTokenMinter.getGetWalletAddress(user1.address);
        const wallet = blockchain.openContract(CustomJettonWallet.fromAddress(walletAddress));
        const walletData = await wallet.getGetWalletData();
        expect(walletData.balance).toBe(mintAmount);
    });

    it('should reject minting from non-owner', async () => {
        const mintResult = await rezaTokenMinter.send(
            user1.getSender(),
            { value: toNano('0.1') },
            {
                $$type: 'Mint',
                amount: toNano('100'),
                receiver: user1.address,
            }
        );

        expect(mintResult.transactions[0]).toMatchObject({
            from: user1.address,
            to: rezaTokenMinter.address,
            success: false,
        });
    });

    it('should close minting correctly', async () => {
        // First mint some tokens
        await rezaTokenMinter.send(
            deployer.getSender(),
            { value: toNano('0.1') },
            {
                $$type: 'Mint',
                amount: toNano('100'),
                receiver: user1.address,
            }
        );

        // Close minting
        const closeResult = await rezaTokenMinter.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            "Owner: MintClose"
        );
        expect(closeResult.transactions[0]).toMatchObject({
            from: deployer.address,
            to: rezaTokenMinter.address,
            success: true,
        });

        // Verify minting is closed
        const jettonData = await rezaTokenMinter.getGetJettonData();
        expect(jettonData.mintable).toBe(false);

        // Try to mint after closing (should fail)
        const mintResult = await rezaTokenMinter.send(
            deployer.getSender(),
            { value: toNano('0.1') },
            {
                $$type: 'Mint',
                amount: toNano('50'),
                receiver: user2.address,
            }
        );

        expect(mintResult.transactions[0]).toMatchObject({
            from: deployer.address,
            to: rezaTokenMinter.address,
            success: false,
        });
    });

    it('should update price feed correctly', async () => {
        const newRate = 3000000; // $3.00 per TON

        const updateResult = await priceFeed.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'UpdatePrice',
                tonUsdRate: BigInt(newRate),
            }
        );

        expect(updateResult.transactions[0]).toMatchObject({
            from: deployer.address,
            to: priceFeed.address,
            success: true,
        });

        const rate = await priceFeed.getGetTonUsdRate();
        expect(rate).toBe(newRate);
    });

    it('should approve sales correctly', async () => {
        const approvalAmount = 1000000; // $1.00 USD

        const approveResult = await rezaTokenMinter.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'ApproveSale',
                user: user1.address,
                amountUsd: BigInt(approvalAmount),
            }
        );

        expect(approveResult.transactions[0]).toMatchObject({
            from: deployer.address,
            to: rezaTokenMinter.address,
            success: true,
        });
    });

    it('should handle token transfers', async () => {
        // First mint tokens to user1
        await rezaTokenMinter.send(
            deployer.getSender(),
            { value: toNano('0.1') },
            {
                $$type: 'Mint',
                amount: toNano('100'),
                receiver: user1.address,
            }
        );

        // Get user1's wallet
        const user1WalletAddress = await rezaTokenMinter.getGetWalletAddress(user1.address);
        const user1Wallet = blockchain.openContract(CustomJettonWallet.fromAddress(user1WalletAddress));

        // Transfer tokens from user1 to user2
        const transferAmount = toNano('50');
        const transferResult = await user1Wallet.send(
            user1.getSender(),
            { value: toNano('0.1') },
            {
                $$type: 'TokenTransfer',
                queryId: BigInt(0),
                amount: transferAmount,
                sender: user2.address, // This is actually the destination
                responseDestination: user1.address,
                customPayload: null,
                forwardTonAmount: toNano('0.01'),
                forwardPayload: beginCell().endCell().asSlice(),
            }
        );

        expect(transferResult.transactions[0]).toMatchObject({
            from: user1.address,
            to: user1WalletAddress,
            success: true,
        });

        // Check balances
        const user1Data = await user1Wallet.getGetWalletData();
        expect(user1Data.balance).toBe(toNano('50'));

        const user2WalletAddress = await rezaTokenMinter.getGetWalletAddress(user2.address);
        const user2Wallet = blockchain.openContract(CustomJettonWallet.fromAddress(user2WalletAddress));
        const user2Data = await user2Wallet.getGetWalletData();
        expect(user2Data.balance).toBe(transferAmount);
    });

    it('should get token metadata correctly', async () => {
        const name = await rezaTokenMinter.getName();
        const symbol = await rezaTokenMinter.getSymbol();
        const decimals = await rezaTokenMinter.getDecimals();

        expect(name).toBe('RezaToken');
        expect(symbol).toBe('RTZ');
        expect(decimals).toBe(18);
    });
});