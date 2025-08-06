import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, Address, beginCell } from '@ton/core';
import { RezaToken } from '../build/Token/Token_RezaToken';
import '@ton/test-utils';

describe('RezaToken', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;
    let token: SandboxContract<RezaToken>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        user = await blockchain.treasury('user');

        // Create metadata content
        const content = beginCell()
            .storeUint(0, 8) // Simple metadata placeholder
            .endCell();

        token = blockchain.openContract(await RezaToken.fromInit(deployer.address, content));

        const deployResult = await token.send(
            deployer.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            },
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: token.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy with correct parameters', async () => {
        const jettonData = await token.getGetJettonData();
        const maxSellLimit = await token.getGetMaxSellLimit();

        expect(jettonData.total_supply).toBe(1000000n * 10n ** 9n); // 1,000,000 tokens
        expect(jettonData.mintable).toBe(false); // not mintable
        expect(jettonData.admin_address.toString()).toBe(deployer.address.toString()); // owner
        expect(maxSellLimit).toBe(1000000000n); // $1 limit
    });

    it('should check approval status correctly', async () => {
        // Initially not approved
        let isApproved = await token.getIsApprovedSeller(user.address);
        expect(isApproved).toBe(false);
    });
});
