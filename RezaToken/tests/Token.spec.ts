import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, beginCell } from '@ton/core';
import { RezaTokenMinter } from '../build/RezaTokenMinter/RezaTokenMinter_RezaTokenMinter';
import { PriceFeed } from '../build/PriceFeed/PriceFeed_PriceFeed';
import '@ton/test-utils';

describe('RezaToken', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;
    let token: SandboxContract<RezaTokenMinter>;
    let priceFeed: SandboxContract<PriceFeed>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        user = await blockchain.treasury('user');

        // Deploy PriceFeed first
        priceFeed = blockchain.openContract(await PriceFeed.fromInit(deployer.address));

        const priceFeedDeployResult = await priceFeed.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            },
        );

        expect(priceFeedDeployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: priceFeed.address,
            deploy: true,
            success: true,
        });

        // Create token metadata
        const content = beginCell()
            .storeUint(0, 8) // onchain content flag
            .storeStringTail("RezaToken") // name
            .storeStringTail("RTZ") // symbol
            .storeStringTail("18") // decimals
            .storeStringTail("Test token") // description
            .endCell();

        // Deploy RezaTokenMinter
        token = blockchain.openContract(await RezaTokenMinter.fromInit(
            deployer.address,
            content,
            priceFeed.address
        ));

        const tokenDeployResult = await token.send(
            deployer.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            },
        );

        expect(tokenDeployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: token.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy both contracts', async () => {
        // Check PriceFeed
        const tonUsdRate = await priceFeed.getGetTonUsdRate();
        expect(tonUsdRate).toBe(2500000n); // Default $2.5

        // Check Token
        const jettonData = await token.getGetJettonData();
        expect(jettonData.totalSupply).toBe(0n);
        expect(jettonData.mintable).toBe(true);
        expect(jettonData.adminAddress).toEqualAddress(deployer.address);
    });

    it('should mint tokens', async () => {
        const mintAmount = toNano('100');
        
        const mintResult = await token.send(
            deployer.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'Mint',
                amount: mintAmount,
                receiver: user.address,
            },
        );

        expect(mintResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: token.address,
            success: true,
        });

        // Check total supply increased
        const jettonData = await token.getGetJettonData();
        expect(jettonData.totalSupply).toBe(mintAmount);
    });

    it('should update price feed', async () => {
        const newRate = 3000000n; // $3.0

        const updateResult = await priceFeed.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'UpdatePrice',
                tonUsdRate: newRate,
            },
        );

        expect(updateResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: priceFeed.address,
            success: true,
        });

        const updatedRate = await priceFeed.getGetTonUsdRate();
        expect(updatedRate).toBe(newRate);
    });

    it('should approve sales', async () => {
        const approvalAmount = 50000000n; // $50 USD

        const approveResult = await token.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'ApproveSale',
                user: user.address,
                amountUsd: approvalAmount,
            },
        );

        expect(approveResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: token.address,
            success: true,
        });
    });
});
