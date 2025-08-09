import { config } from 'dotenv';
import { Address, toNano } from '@ton/core';
import { join } from 'path';

// Load environment variables from .env file in scripts directory
config({ path: join(__dirname, '.env') });

/**
 * Configuration settings loaded from environment variables
 */
export const CONFIG = {
    // Contract address - required
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || '',
    
    // Network configuration
    NETWORK: process.env.NETWORK || 'testnet',
    
    // Gas settings
    DEFAULT_GAS: process.env.DEFAULT_GAS || '0.05',
    
    // Owner address (optional)
    OWNER_ADDRESS: process.env.OWNER_ADDRESS || 'EQDIccByS2ITp9P2Nd3J5L3CyFKSI-U7yBr21K-JW0fdWGlK',
    
    // Debug mode
    DEBUG: process.env.DEBUG === 'true',
};

/**
 * Get the contract address as an Address object
 * @returns Address object for the contract
 * @throws Error if CONTRACT_ADDRESS is not set or invalid
 */
export function getContractAddress(): Address {
    if (!CONFIG.CONTRACT_ADDRESS) {
        throw new Error(
            'CONTRACT_ADDRESS not found in environment variables. ' +
            'Please set it in the .env file in the scripts directory.'
        );
    }
    
    try {
        return Address.parse(CONFIG.CONTRACT_ADDRESS);
    } catch (error) {
        throw new Error(
            `Invalid CONTRACT_ADDRESS format: ${CONFIG.CONTRACT_ADDRESS}. ` +
            'Please provide a valid TON address.'
        );
    }
}

/**
 * Get the default gas amount as nano TON
 * @returns BigInt representing gas amount in nano TON
 */
export function getDefaultGas() {
    return toNano(CONFIG.DEFAULT_GAS);
}

/**
 * Get the owner address if set
 * @returns Address object for the owner or null if not set
 */
export function getOwnerAddress(): Address | null {
    if (!CONFIG.OWNER_ADDRESS) {
        return null;
    }
    
    try {
        return Address.parse(CONFIG.OWNER_ADDRESS);
    } catch (error) {
        console.warn(`Invalid OWNER_ADDRESS format: ${CONFIG.OWNER_ADDRESS}`);
        return null;
    }
}

/**
 * Validate configuration and display current settings
 */
export function validateConfig(): void {
    console.log('📋 Configuration Settings:');
    console.log('='.repeat(40));
    console.log(`Contract Address: ${CONFIG.CONTRACT_ADDRESS || 'NOT SET'}`);
    console.log(`Network: ${CONFIG.NETWORK}`);
    console.log(`Default Gas: ${CONFIG.DEFAULT_GAS} TON`);
    console.log(`Owner Address: ${CONFIG.OWNER_ADDRESS || 'NOT SET'}`);
    console.log(`Debug Mode: ${CONFIG.DEBUG}`);
    console.log('='.repeat(40));
    
    if (!CONFIG.CONTRACT_ADDRESS) {
        console.error('❌ CONTRACT_ADDRESS is required but not set!');
        console.log('Please update the .env file in the scripts directory with your contract address.');
        throw new Error('Missing required configuration: CONTRACT_ADDRESS');
    }
    
    // Validate contract address format
    try {
        Address.parse(CONFIG.CONTRACT_ADDRESS);
        console.log('✅ Contract address format is valid');
    } catch (error) {
        console.error('❌ Invalid contract address format!');
        throw new Error(`Invalid CONTRACT_ADDRESS: ${CONFIG.CONTRACT_ADDRESS}`);
    }
}

/**
 * Log debug information if debug mode is enabled
 * @param message Debug message to log
 * @param data Optional data to log
 */
export function debugLog(message: string, data?: any): void {
    if (CONFIG.DEBUG) {
        console.log(`🐛 DEBUG: ${message}`);
        if (data !== undefined) {
            console.log(data);
        }
    }
}
