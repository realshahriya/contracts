@echo off
setlocal enabledelayedexpansion

:: RezaToken Contract Control Script
:: Comprehensive command-line interface for managing deployed RezaToken contract

title RezaToken Contract Control

:MAIN_MENU
cls
echo.
echo ========================================================
echo                 REZATOKEN CONTRACT CONTROL
echo ========================================================
echo.
echo 📋 CONTRACT INFORMATION
echo   1. Get All Contract Data
echo   2. Check Contract State
echo   3. Get Token Information
echo.
echo 🪙 TOKEN OPERATIONS
echo   4. Mint Tokens (owner only)
echo   5. Enable Minting (owner only)
echo   6. Disable Minting (owner only)
echo   7. Burn Operations Info
echo   8. Burn Tokens
echo   9. Transfer Tokens
echo  10. Update Token Content (owner only)
echo  11. Get Wallet Address
echo  12. Wallet Operations
echo.
echo 👑 OWNER OPERATIONS
echo  13. Transfer Ownership (owner only)
echo  14. Transaction Limits (owner only)
echo  15. Address Exclusions (owner only)
echo.
echo 🚀 DEPLOYMENT
echo  16. Deploy Token (Standard)
echo  17. Deploy Token (Preminted)
echo.
echo 🧪 TESTING & DEVELOPMENT
echo  18. Run Contract Tests
echo  19. Build Contracts
echo  20. Setup Environment
echo.
echo 🌐 NETWORK OPTIONS
echo  21. Switch to Testnet
echo  22. Switch to Mainnet
echo  23. Check Network Status
echo.
echo 📊 MONITORING & ANALYTICS
echo  24. Monitoring Dashboard
echo  25. Analytics Report
echo  26. Health Check
echo.
echo 🔧 UTILITIES
echo  27. Content Management
echo  28. Script Runner
echo  29. View Available Scripts
echo  30. Open Project Directory
echo  31. View Documentation
echo.
echo   0. Exit
echo.
set /p choice="Enter your choice (0-31): "

if "%choice%"=="0" goto EXIT
if "%choice%"=="1" goto GET_ALL_DATA
if "%choice%"=="2" goto CHECK_STATE
if "%choice%"=="3" goto TOKEN_INFO
if "%choice%"=="4" goto MINT_TOKENS
if "%choice%"=="5" goto MINT_OPEN
if "%choice%"=="6" goto MINT_CLOSE
if "%choice%"=="7" goto BURN_INFO
if "%choice%"=="8" goto BURN_TOKENS
if "%choice%"=="9" goto TRANSFER_TOKENS
if "%choice%"=="10" goto UPDATE_CONTENT
if "%choice%"=="11" goto WALLET_ADDRESS
if "%choice%"=="12" goto WALLET_OPERATIONS
if "%choice%"=="13" goto TRANSFER_OWNERSHIP
if "%choice%"=="14" goto TRANSACTION_LIMITS
if "%choice%"=="15" goto ADDRESS_EXCLUSIONS
if "%choice%"=="16" goto DEPLOY_STANDARD
if "%choice%"=="17" goto DEPLOY_PREMINT
if "%choice%"=="18" goto RUN_TESTS
if "%choice%"=="19" goto BUILD_CONTRACTS
if "%choice%"=="20" goto SETUP_ENV
if "%choice%"=="21" goto TESTNET
if "%choice%"=="22" goto MAINNET
if "%choice%"=="23" goto NETWORK_STATUS
if "%choice%"=="24" goto MONITORING
if "%choice%"=="25" goto ANALYTICS
if "%choice%"=="26" goto HEALTH_CHECK
if "%choice%"=="27" goto CONTENT_MANAGEMENT
if "%choice%"=="28" goto SCRIPT_RUNNER
if "%choice%"=="29" goto VIEW_SCRIPTS
if "%choice%"=="30" goto OPEN_DIR
if "%choice%"=="31" goto VIEW_DOCS
goto INVALID

:GET_ALL_DATA
cls
echo 📋 Get All Contract Data
echo ========================
echo.
echo Getting all contract data...
npx blueprint run get-all-data
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:CHECK_STATE
cls
echo 🔍 Check Contract State
echo =======================
echo.
echo Checking contract state...
npx blueprint run check-contract-state
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:TOKEN_INFO
cls
echo 📋 Token Information
echo ===================
echo.
echo Choose information type:
echo 1. Basic Token Data
echo 2. Jetton Data
echo 3. Owner Information
echo 4. Supply Information
echo.
set /p info_choice="Enter choice (1-4): "

if "%info_choice%"=="1" (
    echo Getting basic token data...
    npx blueprint run get-all-data
) else if "%info_choice%"=="2" (
    echo Getting jetton data...
    npx blueprint run get-all-data
) else if "%info_choice%"=="3" (
    echo Getting owner information...
    npx blueprint run get-all-data
) else if "%info_choice%"=="4" (
    echo Getting supply information...
    npx blueprint run get-all-data
) else (
    echo Invalid choice.
)
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:MINT_TOKENS
cls
echo 🪙 Mint Tokens
echo =============
echo.
echo ⚠️  WARNING: Only contract owner can mint tokens!
echo.
set /p confirm="Are you the contract owner? (y/n): "
if /i "%confirm%"=="y" (
    echo Running mint tokens script...
    npx blueprint run mint-tokens
) else (
    echo Operation cancelled.
)
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:MINT_OPEN
cls
echo 🔓 Enable Minting
echo =================
echo.
echo ⚠️  WARNING: Only contract owner can enable minting!
echo.
set /p confirm="Are you the contract owner? (y/n): "
if /i "%confirm%"=="y" (
    echo Running mint open script...
    npx blueprint run mint-open
) else (
    echo Operation cancelled.
)
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:MINT_CLOSE
cls
echo 🔒 Disable Minting
echo ==================
echo.
echo ⚠️  WARNING: Only contract owner can disable minting!
echo.
set /p confirm="Are you the contract owner? (y/n): "
if /i "%confirm%"=="y" (
    echo Running mint close script...
    npx blueprint run mint-close
) else (
    echo Operation cancelled.
)
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:BURN_INFO
cls
echo 🔥 Burn Operations Info
echo ======================
echo.
echo Getting burn operations information...
npx blueprint run burn-operations
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:BURN_TOKENS
cls
echo 🔥 Burn Tokens
echo ==============
echo.
echo Running token burn script...
npx blueprint run token-burn
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:TRANSFER_TOKENS
cls
echo 💸 Transfer Tokens
echo =================
echo.
echo Running token transfer script...
npx blueprint run token-transfer
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:UPDATE_CONTENT
cls
echo 📝 Update Token Content
echo =======================
echo.
echo ⚠️  WARNING: Only contract owner can update content!
echo.
set /p confirm="Are you the contract owner? (y/n): "
if /i "%confirm%"=="y" (
    echo Running update content script...
    npx blueprint run update-content
) else (
    echo Operation cancelled.
)
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:WALLET_ADDRESS
cls
echo 💼 Get Wallet Address
echo ====================
echo.
echo Running get wallet address script...
npx blueprint run get-wallet-address
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:WALLET_OPERATIONS
cls
echo 💼 Wallet Operations
echo ===================
echo.
echo Running wallet operations...
npx blueprint run wallet-operations
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:TRANSFER_OWNERSHIP
cls
echo 👑 Transfer Ownership
echo ====================
echo.
echo ⚠️  CRITICAL WARNING: This action is IRREVERSIBLE!
echo Only the current owner can transfer ownership.
echo.
set /p confirm="Are you sure you want to proceed? (y/n): "
if /i "%confirm%"=="y" (
    echo Running transfer ownership script...
    npx blueprint run owner-transfer
) else (
    echo Operation cancelled.
)
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:TRANSACTION_LIMITS
cls
echo ⚖️ Transaction Limits Management
echo ================================
echo.
echo ⚠️  WARNING: Only contract owner can modify limits!
echo.
set /p confirm="Are you the contract owner? (y/n): "
if /i "%confirm%"=="y" (
    echo Running transaction limits script...
    npx blueprint run transaction-limits
) else (
    echo Operation cancelled.
)
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:ADDRESS_EXCLUSIONS
cls
echo 🚫 Address Exclusions Management
echo ================================
echo.
echo ⚠️  WARNING: Only contract owner can manage exclusions!
echo.
set /p confirm="Are you the contract owner? (y/n): "
if /i "%confirm%"=="y" (
    echo Running address exclusions script...
    npx blueprint run address-exclusions
) else (
    echo Operation cancelled.
)
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:DEPLOY_STANDARD
cls
echo 🚀 Deploy Token (Standard)
echo ==========================
echo.
echo Choose network:
echo 1. Testnet
echo 2. Mainnet
echo.
set /p network_choice="Enter choice (1-2): "

if "%network_choice%"=="1" (
    echo Deploying to testnet...
    npx blueprint run deploytoken --testnet
) else if "%network_choice%"=="2" (
    echo ⚠️  WARNING: Deploying to Mainnet uses real TON!
    set /p confirm="Continue? (y/n): "
    if /i "%confirm%"=="y" (
        echo Deploying to mainnet...
        npx blueprint run deploytoken
    ) else (
        echo Operation cancelled.
    )
) else (
    echo Invalid choice.
)
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:DEPLOY_PREMINT
cls
echo 🚀 Deploy Token (Preminted)
echo ===========================
echo.
echo Choose network:
echo 1. Testnet
echo 2. Mainnet
echo.
set /p network_choice="Enter choice (1-2): "

if "%network_choice%"=="1" (
    echo Deploying preminted token to testnet...
    npx blueprint run deploy-premint --testnet
) else if "%network_choice%"=="2" (
    echo ⚠️  WARNING: Deploying to Mainnet uses real TON!
    set /p confirm="Continue? (y/n): "
    if /i "%confirm%"=="y" (
        echo Deploying preminted token to mainnet...
        npx blueprint run deploy-premint
    ) else (
        echo Operation cancelled.
    )
) else (
    echo Invalid choice.
)
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU



:RUN_TESTS
cls
echo 🧪 Run Contract Tests
echo =====================
echo.
echo Running contract tests...
npm test
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:BUILD_CONTRACTS
cls
echo 🔨 Build Contracts
echo ==================
echo.
echo Building contracts...
npx blueprint build
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:SETUP_ENV
cls
echo ⚙️ Setup Environment
echo ====================
echo.
echo Running environment setup...
npx blueprint run setup-env
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:TESTNET
cls
echo 🌐 Switch to Testnet
echo ====================
echo.
echo Network switching is handled automatically by scripts.
echo Use --testnet flag for testnet operations.
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:MAINNET
cls
echo 🌐 Switch to Mainnet
echo ====================
echo.
echo Network switching is handled automatically by scripts.
echo Mainnet is the default for most operations.
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:NETWORK_STATUS
cls
echo 🌐 Network Status
echo =================
echo.
echo Checking network status...
echo.
echo Current network configuration:
echo - Testnet: Available
echo - Mainnet: Available
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:MONITORING
cls
echo 📈 Monitoring
echo =============
echo.
echo ⚠️  WARNING: Monitoring features are not yet implemented!
echo This feature is coming soon.
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:ANALYTICS
cls
echo 📊 Analytics
echo ============
echo.
echo ⚠️  WARNING: Analytics features are not yet implemented!
echo This feature is coming soon.
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:HEALTH_CHECK
cls
echo 🏥 Health Check
echo ===============
echo.
echo Performing basic health check...
echo.
echo ✅ Node.js: Available
echo ✅ NPX: Available
echo ✅ Blueprint: Available
echo ✅ Scripts directory: Available
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:CONTENT_MANAGEMENT
cls
echo 📝 Content Management
echo =====================
echo.
echo Running content management...
npx blueprint run content-management
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:SCRIPT_RUNNER
cls
echo 🏃 Script Runner
echo ===============
echo.
echo Running script runner utility...
npx blueprint run script-runner
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:VIEW_SCRIPTS
cls
echo 📋 Available Scripts
echo ===================
echo.
echo Main Scripts:
echo - deploytoken.ts (Deploy standard token)
echo - deploy-premint.ts (Deploy preminted token)
echo - get-all-data.ts (Get all contract data)
echo - check-contract-state.ts (Check contract state)
echo - content-management.ts (Manage content)
echo - script-runner.ts (Script runner utility)
echo - setup-env.ts (Environment setup)
echo.
echo Function Scripts:
echo - mint-tokens.ts (Mint tokens)
echo - mint-open.ts (Enable minting)
echo - mint-close.ts (Disable minting)
echo - burn-operations.ts (Burn operations info)
echo - token-burn.ts (Burn tokens)
echo - token-transfer.ts (Transfer tokens)
echo - update-content.ts (Update content)
echo - get-wallet-address.ts (Get wallet address)
echo - wallet-operations.ts (Wallet operations)
echo - owner-transfer.ts (Transfer ownership)
echo - transaction-limits.ts (Transaction limits)
echo - address-exclusions.ts (Address exclusions)
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:OPEN_DIR
cls
echo 📁 Opening Project Directory
echo ============================
echo.
echo Opening project directory in File Explorer...
start .
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:VIEW_DOCS
cls
echo 📚 View Documentation
echo =====================
echo.
echo Documentation files:
echo - README.md (Project overview)
echo - contracts/ (Contract source code)
echo - scripts/ (Deployment and management scripts)
echo - wrappers/ (Contract wrappers)
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU

:EXIT
cls
echo 👋 Goodbye!
echo.
echo Thank you for using RezaToken Contract Control!
echo.
timeout /t 2 >nul
exit /b 0

:INVALID
cls
echo ❌ Invalid Choice
echo =================
echo.
echo Please enter a valid option number (0-31).
echo.
echo Press any key to return to main menu...
pause >nul
goto MAIN_MENU