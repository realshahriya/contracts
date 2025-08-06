# RezaToken Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. Deployment Error: "LITE_SERVER_UNKNOWN: cannot apply external message to current state"

**Error Message:**

```console
AxiosError: Request failed with status code 500
error: 'LITE_SERVER_UNKNOWN: cannot apply external message to current state : Failed to unpack account state'
```

**Cause:** Insufficient testnet TON in your wallet

**Solution:**

1. Check your wallet address: `npm run check-balance`
2. Visit one of these testnet faucets:
   - <https://testnet.tonhub.com/>
   - <https://t.me/testgiver_ton_bot>
3. Send your wallet address to get testnet TON
4. Wait for confirmation (check on <https://testnet.tonscan.org>)
5. Retry deployment: `npm run start`

**Required Balance:**

- Minimum: 0.5 TON
- Recommended: 1.0 TON

### 2. Network Connection Issues

**Symptoms:** Timeout errors, connection refused

**Solutions:**

1. Check your internet connection
2. Try switching networks in the deployment script
3. Wait a few minutes and retry
4. Use a VPN if you're in a restricted region

### 3. Build Errors

**Error:** TypeScript compilation errors

**Solution:**

1. Clean build: `rm -rf build/` (or delete build folder)
2. Rebuild: `npm run build`
3. Check for syntax errors in .tact files

### 4. Environment Variables Not Set

**Error:** `WALLET_MNEMONIC` or `WALLET_VERSION` not found

**Solution:**

1. Ensure `.env` file exists in project root
2. Check `.env` file contains:

   ```console
   WALLET_MNEMONIC="your mnemonic phrase here"
   WALLET_VERSION=v4R2
   NETWORK=testnet
   ```

3. Generate new wallet if needed: `npm run generate-wallet`

### 5. Contract Already Deployed

**Error:** Contract address already exists

**Solution:**

1. This is actually success! The contract is already deployed
2. Check the contract address on testnet explorer
3. Use the existing deployment for testing

### 6. Gas Limit Exceeded

**Error:** Out of gas during deployment

**Solution:**

1. Increase the deployment value in `deployToken.ts`
2. Change `toNano('0.05')` to `toNano('0.1')` or higher
3. Ensure wallet has sufficient balance

## Verification Steps

### After Successful Deployment

1. **Check Contract on Explorer:**
   - Visit: <https://testnet.tonscan.org>
   - Search for your contract addresses
   - Verify transactions are confirmed

2. **Test Contract Functions:**

   ```bash
   npm test
   ```

3. **Verify Token Data:**
   - Check token name, symbol, decimals
   - Verify total supply is 0 (before minting)
   - Confirm owner address

## Getting Help

### Useful Links

- TON Testnet Explorer: <https://testnet.tonscan.org>
- TON Documentation: <https://docs.ton.org>
- Tact Documentation: <https://docs.tact-lang.org>
- Blueprint Documentation: <https://github.com/ton-org/blueprint>

### Debug Commands

```bash
# Check wallet info
npm run check-balance

# Generate new wallet
npm run generate-wallet

# Build contracts
npm run build

# Run tests
npm test

# Deploy contracts
npm run start
```

### Log Analysis

When deployment fails, look for:

1. **Network errors:** Check internet connection
2. **Balance errors:** Fund your wallet
3. **Gas errors:** Increase deployment value
4. **Compilation errors:** Fix contract code

## Prevention Tips

1. **Always check balance before deployment**
2. **Test on testnet first**
3. **Keep backup of mnemonic phrase**
4. **Monitor gas costs**
5. **Verify contract addresses after deployment**

## Emergency Recovery

If you lose access to your wallet:

1. Use your mnemonic phrase backup
2. Generate new wallet: `npm run generate-wallet`
3. Update `.env` with new mnemonic
4. Fund new wallet and redeploy

---

**Need more help?** Check the deployment logs carefully and compare with the expected output in `DEPLOYMENT_SUMMARY.md`.
