import { 
    Cell,
    Slice, 
    Address, 
    Builder, 
    beginCell, 
    ComputeError, 
    TupleItem, 
    TupleReader, 
    Dictionary, 
    contractAddress, 
    ContractProvider, 
    Sender, 
    Contract, 
    ContractABI, 
    ABIType,
    ABIGetter,
    ABIReceiver,
    TupleBuilder,
    DictionaryValue
} from '@ton/core';

export type RezaTokenMinterConfig = {
    owner: Address;
    jettonContent: Cell;
    jettonWalletCode: Cell;
    priceFeedAddress: Address;
};

export function rezaTokenMinterConfigToCell(config: RezaTokenMinterConfig): Cell {
    return beginCell()
        .storeCoins(0) // total_supply
        .storeAddress(config.owner)
        .storeRef(config.jettonContent)
        .storeRef(config.jettonWalletCode)
        .storeAddress(config.priceFeedAddress)
        .storeBit(true) // minting_enabled
        .endCell();
}

const RezaTokenMinterErrors: { [key: number]: { message: string } } = {
    132: { message: `Unauthorized` },
    133: { message: `Minting disabled` },
    134: { message: `Invalid amount` },
}

const RezaTokenMinterTypes: ABIType[] = [
    {"name":"StateInit","header":null,"fields":[{"name":"code","type":{"kind":"simple","type":"cell","optional":false}},{"name":"data","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"Context","header":null,"fields":[{"name":"bounced","type":{"kind":"simple","type":"bool","optional":false}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"raw","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"SendParameters","header":null,"fields":[{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"code","type":{"kind":"simple","type":"cell","optional":true}},{"name":"data","type":{"kind":"simple","type":"cell","optional":true}}]},
    {"name":"Mint","header":1,"fields":[{"name":"amount","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"receiver","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"ApproveSale","header":2,"fields":[{"name":"user","type":{"kind":"simple","type":"address","optional":false}},{"name":"usd_amount","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
    {"name":"CheckSaleApproval","header":3,"fields":[{"name":"user","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"TonUsdRate","header":4,"fields":[{"name":"rate","type":{"kind":"simple","type":"int","optional":false,"format":257}}]}
]

const RezaTokenMinterGetters: ABIGetter[] = [
    {"name":"get_jetton_data","arguments":[],"returnType":{"kind":"simple","type":"JettonData","optional":false}},
    {"name":"get_wallet_address","arguments":[{"name":"owner","type":{"kind":"simple","type":"address","optional":false}}],"returnType":{"kind":"simple","type":"address","optional":false}},
    {"name":"get_sale_approval","arguments":[{"name":"user","type":{"kind":"simple","type":"address","optional":false}}],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}}
]

const RezaTokenMinterReceivers: ABIReceiver[] = [
    {"receiver":"internal","message":{"kind":"typed","type":"Mint"}},
    {"receiver":"internal","message":{"kind":"typed","type":"ApproveSale"}},
    {"receiver":"internal","message":{"kind":"typed","type":"CheckSaleApproval"}},
    {"receiver":"internal","message":{"kind":"typed","type":"TonUsdRate"}},
]

export class RezaTokenMinter implements Contract {
    
    static createFromAddress(address: Address) {
        return new RezaTokenMinter(address);
    }
    
    static createFromConfig(config: RezaTokenMinterConfig, code: Cell, workchain = 0) {
        const data = rezaTokenMinterConfigToCell(config);
        const init = { code, data };
        return new RezaTokenMinter(contractAddress(workchain, init), init);
    }
    
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}
    
    static get abi(): ContractABI {
        return {
            types:  RezaTokenMinterTypes,
            getters: RezaTokenMinterGetters,
            receivers: RezaTokenMinterReceivers,
            errors: RezaTokenMinterErrors,
        }
    }
}