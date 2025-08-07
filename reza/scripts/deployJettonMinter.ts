import { toNano, beginCell, Dictionary } from '@ton/core';
import { JettonMinter } from '../wrappers/JettonMinter';
import { sha256_sync } from '@ton/crypto';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    // Compile both contracts
    const jettonMinterCode = await compile('JettonMinter');
    const jettonWalletCode = await compile('JettonWallet');

    // Define jetton metadata
    const jettonParams = {
        name: "RezaToken",
        description: "RezaToken with $1 sell limit restriction",
        symbol: "RTZ",
        decimals: "9",
        image: "https://example.com/rezatoken.png",
    };

    // Create proper TEP-64 compliant metadata using dictionary format
    const jettonContent = beginCell()
        .storeUint(0, 8) // onchain content tag
        .storeDict(
            Dictionary.empty(Dictionary.Keys.Buffer(32), Dictionary.Values.Cell())
                .set(sha256_sync("name"), beginCell().storeUint(0, 8).storeStringTail(jettonParams.name).endCell())
                .set(sha256_sync("symbol"), beginCell().storeUint(0, 8).storeStringTail(jettonParams.symbol).endCell())
                .set(sha256_sync("description"), beginCell().storeUint(0, 8).storeStringTail(jettonParams.description).endCell())
                .set(sha256_sync("decimals"), beginCell().storeUint(0, 8).storeStringTail(jettonParams.decimals).endCell())
                .set(sha256_sync("image"), beginCell().storeUint(0, 8).storeStringTail(jettonParams.image).endCell())
        )
        .endCell();

    // Deploy the jetton minter with $1 sell limit (1 TON = ~$1 approximation)
    const sellLimit = toNano('1'); // 1 TON as approximation for $1
    const jettonMinter = provider.open(JettonMinter.createFromConfig({
        admin: provider.sender().address!,
        content: jettonContent,
        wallet_code: jettonWalletCode,
        sell_limit: sellLimit,
    }, jettonMinterCode));

    await jettonMinter.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(jettonMinter.address);

    console.log('Jetton Minter deployed at:', jettonMinter.address);

    // Mint 1,000,000 RTZ tokens to the deployer (with 9 decimals)
    const mintAmount = BigInt('1000000000000000'); // 1,000,000 tokens with 9 decimals
    await jettonMinter.sendMint(provider.sender(), {
        to: provider.sender().address!,
        jetton_amount: mintAmount,
        forward_ton_amount: toNano('0.05'),
        total_ton_amount: toNano('0.1'),
    });

    console.log('Minted 1,000,000 REZA tokens to:', provider.sender().address);

    // Get jetton data
    const jettonData = await jettonMinter.getJettonData();
    console.log('Total Supply:', jettonData.totalSupply.toString());
    console.log('Admin:', jettonData.adminAddress);
    console.log('Mintable:', jettonData.mintable);

    // Get wallet address for the deployer
    const walletAddress = await jettonMinter.getWalletAddress(provider.sender().address!);
    console.log('Deployer wallet address:', walletAddress);
}