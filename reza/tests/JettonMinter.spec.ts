import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano, beginCell, Address, Dictionary } from '@ton/core';
import { JettonMinter } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';
import { sha256_sync } from '@ton/crypto';
import { compile } from '@ton/blueprint';
import '@ton/test-utils';

describe('JettonMinter', () => {
    let code: Cell;
    let walletCode: Cell;

    beforeAll(async () => {
        code = await compile('JettonMinter');
        walletCode = await compile('JettonWallet');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let jettonMinter: SandboxContract<JettonMinter>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');

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

        jettonMinter = blockchain.openContract(JettonMinter.createFromConfig({
            admin: deployer.address,
            content: jettonContent,
            wallet_code: walletCode,
            sell_limit: toNano('1'), // $1 sell limit
        }, code));

        const deployResult = await jettonMinter.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMinter.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and jettonMinter are ready to use
    });

    it('should mint tokens', async () => {
        const user = await blockchain.treasury('user');
        
        const mintResult = await jettonMinter.sendMint(deployer.getSender(), {
            to: user.address,
            jetton_amount: toNano('1000'),
            forward_ton_amount: toNano('0.05'),
            total_ton_amount: toNano('0.1'),
        });

        expect(mintResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMinter.address,
            success: true,
        });

        const jettonData = await jettonMinter.getJettonData();
        expect(jettonData.totalSupply).toEqual(toNano('1000'));
    });

    it('should get wallet address', async () => {
        const user = await blockchain.treasury('user');
        const walletAddress = await jettonMinter.getWalletAddress(user.address);
        
        expect(walletAddress).toBeInstanceOf(Address);
    });

    it('should change admin', async () => {
        const newAdmin = await blockchain.treasury('newAdmin');
        
        const changeAdminResult = await jettonMinter.sendChangeAdmin(deployer.getSender(), newAdmin.address);
        
        expect(changeAdminResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMinter.address,
            success: true,
        });

        const jettonData = await jettonMinter.getJettonData();
        expect(jettonData.adminAddress.equals(newAdmin.address)).toBeTruthy();
    });

    it('should change content', async () => {
        const newContent = beginCell()
            .storeUint(0, 8) // onchain content tag
            .storeDict(
                Dictionary.empty(Dictionary.Keys.Buffer(32), Dictionary.Values.Cell())
                    .set(sha256_sync("name"), beginCell().storeUint(0, 8).storeStringTail("New Token").endCell())
                    .set(sha256_sync("symbol"), beginCell().storeUint(0, 8).storeStringTail("NEW").endCell())
                    .set(sha256_sync("description"), beginCell().storeUint(0, 8).storeStringTail("Updated token description").endCell())
                    .set(sha256_sync("decimals"), beginCell().storeUint(0, 8).storeStringTail("9").endCell())
            )
            .endCell();

        const changeContentResult = await jettonMinter.sendChangeContent(deployer.getSender(), toNano('0.05'), newContent);
        
        expect(changeContentResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMinter.address,
            success: true,
        });

        const jettonData = await jettonMinter.getJettonData();
        expect(jettonData.content.equals(newContent)).toBeTruthy();
    });

    it('should get sell limit', async () => {
        const sellLimit = await jettonMinter.getSellLimit();
        expect(sellLimit).toEqual(toNano('1'));
    });

    it('should change sell limit', async () => {
        const newSellLimit = toNano('2');
        const result = await jettonMinter.sendChangeSellLimit(deployer.getSender(), toNano('0.05'), newSellLimit);
        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMinter.address,
            success: true,
        });

        const sellLimit = await jettonMinter.getSellLimit();
        expect(sellLimit).toEqual(newSellLimit);
    });

    it('should approve sell', async () => {
        const user = await blockchain.treasury('user');
        const recipient = await blockchain.treasury('recipient');
        const approvedAmount = toNano('5');

        const result = await jettonMinter.sendApproveSell(
            deployer.getSender(),
            toNano('0.1'),
            user.address,
            recipient.address,
            approvedAmount
        );

        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMinter.address,
            success: true,
        });
    });
});