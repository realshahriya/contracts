# RezaToken Contract Control PowerShell Script
# Advanced command-line interface for managing deployed RezaToken contract

param(
    [string]$Action = "",
    [string]$Network = "testnet",
    [switch]$Help,
    [switch]$Testnet,
    [switch]$Mainnet,
    [string]$Amount = "",
    [string]$Address = ""
)

# Set console title
$Host.UI.RawUI.WindowTitle = "RezaToken Contract Control"

# Color scheme
$Colors = @{
    Header = "Cyan"
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Info = "White"
    Prompt = "Magenta"
}

function Write-ColorText {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Colors[$Color]
}

function Show-Header {
    Clear-Host
    Write-ColorText "========================================================" "Header"
    Write-ColorText "                 REZATOKEN CONTRACT CONTROL" "Header"
    Write-ColorText "========================================================" "Header"
    Write-Host ""
}

function Show-Help {
    Show-Header
    Write-ColorText "USAGE:" "Info"
    Write-Host "  .\contract-control.ps1 [ACTION] [OPTIONS]"
    Write-Host ""
    Write-ColorText "ACTIONS:" "Info"
    Write-Host "  info           - Get all contract data"
    Write-Host "  check-state    - Check contract state"
    Write-Host "  mint           - Mint tokens (owner only)"
    Write-Host "  mint-open      - Enable minting (owner only)"
    Write-Host "  mint-close     - Disable minting (owner only)"
    Write-Host "  burn           - Show burn operations info"
    Write-Host "  burn-tokens    - Burn tokens"
    Write-Host "  transfer       - Transfer ownership (owner only)"
    Write-Host "  transfer-tokens- Transfer tokens"
    Write-Host "  limits         - Manage transaction limits (owner only)"
    Write-Host "  exclusions     - Manage address exclusions (owner only)"
    Write-Host "  wallet-ops     - Wallet operations"
    Write-Host "  wallet-address - Get wallet address"
    Write-Host "  update-content - Update token content (owner only)"
    Write-Host "  deploy         - Deploy token (standard)"
    Write-Host "  deploy-premint - Deploy token (preminted)"

    Write-Host "  content        - Content management"
    Write-Host "  script-runner  - Script runner"
    Write-Host "  build          - Build contracts"
    Write-Host "  test           - Run tests"
    Write-Host "  setup          - Setup environment"
    Write-Host ""
    Write-ColorText "OPTIONS:" "Info"
    Write-Host "  -Network       - Network (testnet/mainnet)"
    Write-Host "  -Testnet       - Use testnet"
    Write-Host "  -Mainnet       - Use mainnet"
    Write-Host "  -Amount        - Amount for operations"
    Write-Host "  -Address       - Address for operations"
    Write-Host "  -Help          - Show this help"
    Write-Host ""
    Write-ColorText "EXAMPLES:" "Info"
    Write-Host "  .\contract-control.ps1 info -Testnet"
    Write-Host "  .\contract-control.ps1 mint -Amount 1000000"
    
    Write-Host ""
}

function Confirm-Action {
    param([string]$Message, [string]$Type = "Warning")
    Write-ColorText $Message $Type
    $response = Read-Host "Continue? (y/n)"
    return $response -eq "y" -or $response -eq "yes"
}

function Invoke-ContractCommand {
    param([string]$Command, [string]$Description)
    Write-ColorText "🚀 $Description" "Info"
    Write-Host "Executing: $Command" -ForegroundColor Gray
    Write-Host ""
    
    try {
        Invoke-Expression $Command
        Write-ColorText "✅ Command completed successfully!" "Success"
    }
    catch {
        Write-ColorText "❌ Command failed: $($_.Exception.Message)" "Error"
    }
    
    Write-Host ""
    Read-Host "Press Enter to continue"
}

function Execute-Command {
    param([string]$Command, [string]$Description)
    Write-ColorText "🚀 $Description" "Info"
    Write-Host "Executing: $Command" -ForegroundColor Gray
    Write-Host ""
    
    try {
        Invoke-Expression $Command
        Write-ColorText "✅ Command completed successfully!" "Success"
    }
    catch {
        Write-ColorText "❌ Command failed: $($_.Exception.Message)" "Error"
    }
    
    Write-Host ""
    Read-Host "Press Enter to continue"
}

function Get-NetworkFlag {
    if ($Testnet -or $Network -eq "testnet") {
        return "--testnet"
    }
    return ""
}

function Show-MainMenu {
    while ($true) {
        Show-Header
        Write-ColorText "📋 CONTRACT INFORMATION" "Info"
        Write-Host "  1. Get All Contract Data"
        Write-Host "  2. Check Contract State"
        Write-Host "  3. Get Token Information"
        Write-Host ""
        
        Write-ColorText "🪙 TOKEN OPERATIONS" "Info"
        Write-Host "  4. Mint Tokens"
        Write-Host "  5. Enable Minting (owner only)"
        Write-Host "  6. Disable Minting (owner only)"
        Write-Host "  7. Burn Operations Info"
        Write-Host "  8. Burn Tokens"
        Write-Host "  9. Transfer Tokens"
        Write-Host "  10. Update Token Content (owner only)"
        Write-Host "  11. Get Wallet Address"
        Write-Host ""
        
        Write-ColorText "👑 OWNER OPERATIONS" "Info"
        Write-Host "  12. Transfer Ownership"
        Write-Host "  13. Set Transaction Limits"
        Write-Host "  14. Manage Address Exclusions"
        Write-Host ""
        
        Write-ColorText "🚀 DEPLOYMENT" "Info"
        Write-Host "  15. Deploy Token (Standard)"
        Write-Host "  16. Deploy Token (Preminted)"
        Write-Host ""
        
        Write-ColorText "🧪 TESTING `& DEVELOPMENT" "Info"
        Write-Host "  17. Run Contract Tests"
        Write-Host "  18. Build Contracts"
        Write-Host "  19. Setup Environment"
        Write-Host ""
        
        Write-ColorText "🌐 NETWORK OPTIONS" "Info"
        Write-Host "  20. Switch to Testnet"
        Write-Host "  21. Switch to Mainnet"
        Write-Host "  22. Check Network Status"
        Write-Host ""
        
        Write-ColorText "📊 MONITORING & ANALYTICS" "Info"
        Write-Host "  23. Wallet Operations"
        Write-Host "  24. Content Management"
        Write-Host "  25. Script Runner"
        Write-Host ""
        
        Write-ColorText "🔧 UTILITIES" "Info"
        Write-Host "  26. View Available Scripts"
        Write-Host "  27. Open Project Directory"
        Write-Host "  28. View Documentation"
        Write-Host "  29. Quick Deploy (Testnet)"
        Write-Host "  30. Health Check"
        Write-Host ""
        
        Write-Host "  0. Exit"
        Write-Host ""
        
        $networkFlag = Get-NetworkFlag
        $currentNetwork = if ($networkFlag -eq "--testnet") { "Testnet" } else { "Mainnet" }
        Write-ColorText "Current Network: $currentNetwork" "Prompt"
        Write-Host ""
        
        $choice = Read-Host "Enter your choice (0-30)"
        
        switch ($choice) {
            "0" { return }
            "1" { Execute-Command "npx blueprint run get-all-data $networkFlag" "Getting All Contract Data" }
            "2" { Execute-Command "npx blueprint run check-contract-state $networkFlag" "Checking Contract State" }
            "3" { Show-TokenInfo }
            "4" { Show-MintTokens }
            "5" { Execute-Command "npx blueprint run mint-open $networkFlag" "Enable Minting (Owner Only)" }
            "6" { Execute-Command "npx blueprint run mint-close $networkFlag" "Disable Minting (Owner Only)" }
            "7" { Execute-Command "npx blueprint run burn-operations $networkFlag" "Showing Burn Operations Info" }
            "8" { Execute-Command "npx blueprint run token-burn $networkFlag" "Burn Tokens" }
            "9" { Execute-Command "npx blueprint run token-transfer $networkFlag" "Transfer Tokens" }
            "10" { Execute-Command "npx blueprint run update-content $networkFlag" "Update Token Content (Owner Only)" }
            "11" { Execute-Command "npx blueprint run get-wallet-address $networkFlag" "Get Wallet Address" }
            "12" { Show-TransferOwnership }
            "13" { Show-TransactionLimits }
            "14" { Execute-Command "npx blueprint run address-exclusions $networkFlag" "Managing Address Exclusions" }
            "15" { Execute-Command "npx blueprint run deploytoken $networkFlag" "Deploy Token (Standard)" }
            "16" { Execute-Command "npx blueprint run deploy-premint $networkFlag" "Deploy Token (Preminted)" }
            "17" { Show-RunTests }
            "18" { Execute-Command "npm run build" "Building Contracts" }
            "19" { Execute-Command "npx blueprint run setup-env" "Setting Up Environment" }
            "20" { $script:Network = "testnet"; $script:Testnet = $true; Write-ColorText "✅ Switched to Testnet" "Success"; Start-Sleep 2 }
            "21" { $script:Network = "mainnet"; $script:Testnet = $false; Write-ColorText "✅ Switched to Mainnet" "Success"; Start-Sleep 2 }
            "22" { Show-NetworkStatus }
            "23" { Execute-Command "npx blueprint run wallet-operations $networkFlag" "Managing Wallet Operations" }
            "24" { Execute-Command "npx blueprint run content-management $networkFlag" "Managing Content" }
            "25" { Execute-Command "npx blueprint run script-runner $networkFlag" "Running Script Runner" }
            "26" { Show-AvailableScripts }
            "27" { Start-Process explorer . }
            "28" { Show-Documentation }
            "29" { Show-QuickDeploy }
            "30" { Show-HealthCheck }
            default { Write-ColorText "❌ Invalid choice. Please try again." "Error"; Start-Sleep 2 }
        }
    }
}

function Show-TokenInfo {
    Show-Header
    Write-ColorText "📋 Token Information Options" "Info"
    Write-Host "1. Basic Token Data"
    Write-Host "2. Jetton Data"
    Write-Host "3. Owner Information"
    Write-Host "4. Supply Information"
    Write-Host "5. All Information"
    Write-Host ""
    
    $choice = Read-Host "Enter choice (1-5)"
    $networkFlag = Get-NetworkFlag
    
    switch ($choice) {
        "1" { Execute-Command "npx blueprint run get-all-data $networkFlag" "Getting Basic Token Data" }
        "2" { Execute-Command "npx blueprint run get-all-data $networkFlag" "Getting Jetton Data" }
        "3" { Execute-Command "npx blueprint run get-all-data $networkFlag" "Getting Owner Information" }
        "4" { Execute-Command "npx blueprint run get-all-data $networkFlag" "Getting Supply Information" }
        "5" { Execute-Command "npx blueprint run get-all-data $networkFlag" "Getting All Information" }
        default { Write-ColorText "❌ Invalid choice." "Error"; Start-Sleep 2 }
    }
}

function Show-MintTokens {
    Show-Header
    Write-ColorText "🪙 Mint Tokens" "Info"
    Write-ColorText "⚠️  WARNING: Only contract owner can mint tokens!" "Warning"
    
    if (-not (Confirm-Action "Are you the contract owner?")) {
        return
    }
    
    $networkFlag = Get-NetworkFlag
    Execute-Command "npx blueprint run mint-tokens $networkFlag" "Minting Tokens"
}

function Show-TransferOwnership {
    Show-Header
    Write-ColorText "👑 Transfer Ownership" "Info"
    Write-ColorText "⚠️  CRITICAL WARNING: This action is IRREVERSIBLE!" "Error"
    Write-ColorText "Only the current owner can transfer ownership." "Warning"
    
    if (-not (Confirm-Action "Are you sure you want to proceed?" "Error")) {
        return
    }
    
    $networkFlag = Get-NetworkFlag
    Execute-Command "npx blueprint run owner-transfer $networkFlag" "Transferring Ownership"
}

function Show-TransactionLimits {
    Show-Header
    Write-ColorText "⚖️ Transaction Limits Management" "Info"
    Write-ColorText "⚠️  WARNING: Only contract owner can modify limits!" "Warning"
    
    if (-not (Confirm-Action "Are you the contract owner?")) {
        return
    }
    
    $networkFlag = Get-NetworkFlag
    Execute-Command "npx blueprint run transaction-limits $networkFlag" "Managing Transaction Limits"
}



function Show-RunTests {
    Show-Header
    Write-ColorText "🧪 Run Contract Tests" "Info"
    Write-Host "1. All Tests"
    Write-Host "2. DEX Integration Tests"
    Write-Host "3. Build and Test"
    Write-Host "4. Test with Coverage"
    Write-Host ""
    
    $choice = Read-Host "Enter choice (1-4)"
    
    switch ($choice) {
        "1" { Execute-Command "npm test" "Running All Tests" }
        "2" { Execute-Command "npm test -- DexIntegration" "Running DEX Integration Tests" }
        "3" { Execute-Command "npm run build && npm test" "Building and Testing" }
        "4" { Execute-Command "npm test -- --coverage" "Running Tests with Coverage" }
        default { Write-ColorText "❌ Invalid choice." "Error"; Start-Sleep 2 }
    }
}

function Show-NetworkStatus {
    Show-Header
    Write-ColorText "🌐 Network Status" "Info"
    Write-Host ""
    
    Write-ColorText "Checking Testnet..." "Info"
    try {
        $testnetResponse = Invoke-RestMethod -Uri "https://testnet.toncenter.com/api/v2/getMasterchainInfo" -TimeoutSec 10
        if ($testnetResponse.ok) {
            Write-ColorText "✅ Testnet: Online" "Success"
        } else {
            Write-ColorText "❌ Testnet: Issues detected" "Warning"
        }
    } catch {
        Write-ColorText "❌ Testnet: Connection failed" "Error"
    }
    
    Write-ColorText "Checking Mainnet..." "Info"
    try {
        $mainnetResponse = Invoke-RestMethod -Uri "https://toncenter.com/api/v2/getMasterchainInfo" -TimeoutSec 10
        if ($mainnetResponse.ok) {
            Write-ColorText "✅ Mainnet: Online" "Success"
        } else {
            Write-ColorText "❌ Mainnet: Issues detected" "Warning"
        }
    } catch {
        Write-ColorText "❌ Mainnet: Connection failed" "Error"
    }
    
    Write-Host ""
    Write-ColorText "Network Endpoints:" "Info"
    Write-Host "• Testnet API: https://testnet.toncenter.com/api/v2/"
    Write-Host "• Testnet Explorer: https://testnet.tonscan.org/"
    Write-Host "• Mainnet API: https://toncenter.com/api/v2/"
    Write-Host "• Mainnet Explorer: https://tonscan.org/"
    Write-Host ""
    
    Read-Host "Press Enter to continue"
}

function Show-AvailableScripts {
    Show-Header
    Write-ColorText "📜 Available Scripts" "Info"
    Write-Host ""
    
    Write-ColorText "Blueprint Scripts:" "Info"
    Get-ChildItem -Path "scripts\*.ts" | ForEach-Object { Write-Host "• $($_.BaseName)" }
    
    Write-Host ""
    Write-ColorText "NPM Scripts:" "Info"
    Write-Host "• npm run build    : Build all contracts"
    Write-Host "• npm run test     : Run all tests"
    Write-Host "• npm run start    : Start blueprint"
    Write-Host "• npm run release  : Pack and publish"
    
    Write-Host ""
    Read-Host "Press Enter to continue"
}

function Show-Documentation {
    Show-Header
    Write-ColorText "📚 Documentation" "Info"
    Write-Host ""
    
    $docs = @()
    if (Test-Path "README.md") { $docs += @{Name="README.md"; Path="README.md"} }
    if (Test-Path "DEX_INTEGRATION_GUIDE.md") { $docs += @{Name="DEX Integration Guide"; Path="DEX_INTEGRATION_GUIDE.md"} }
    if (Test-Path "TESTNET_DEPLOYMENT_PLAN.md") { $docs += @{Name="Testnet Deployment Plan"; Path="TESTNET_DEPLOYMENT_PLAN.md"} }
    
    Write-ColorText "Available Documentation:" "Info"
    for ($i = 0; $i -lt $docs.Count; $i++) {
        Write-Host "$($i + 1). $($docs[$i].Name)"
    }
    Write-Host "$($docs.Count + 1). Open all documents"
    Write-Host ""
    
    $choice = Read-Host "Enter choice (1-$($docs.Count + 1))"
    
    if ($choice -ge 1 -and $choice -le $docs.Count) {
        Start-Process $docs[$choice - 1].Path
    } elseif ($choice -eq ($docs.Count + 1)) {
        foreach ($doc in $docs) {
            Start-Process $doc.Path
        }
    } else {
        Write-ColorText "❌ Invalid choice." "Error"
        Start-Sleep 2
    }
}

function Show-QuickDeploy {
    Show-Header
    Write-ColorText "🚀 Quick Deploy (Testnet)" "Info"
    Write-ColorText "This will perform a complete testnet deployment and setup." "Info"
    Write-Host ""
    
    if (-not (Confirm-Action "Proceed with quick testnet deployment?")) {
        return
    }
    
    Write-ColorText "Step 1: Building contracts..." "Info"
    Execute-Command "npm run build" "Building Contracts"
    
    Write-ColorText "Step 2: Deploying token..." "Info"
    Execute-Command "npx blueprint run deploytoken --testnet" "Deploying Token"
    
    Write-ColorText "Step 3: Running tests..." "Info"
    Execute-Command "npm test" "Running Tests"
    
    Write-ColorText "🎉 Quick deployment completed!" "Success"
}

function Show-HealthCheck {
    Show-Header
    Write-ColorText "🏥 Health Check" "Info"
    Write-Host ""
    
    Write-ColorText "Checking project structure..." "Info"
    $checks = @(
        @{Name="package.json"; Path="package.json"},
        @{Name="tact.config.json"; Path="tact.config.json"},
        @{Name="Token contract"; Path="contracts\token.tact"},
        @{Name="Scripts directory"; Path="scripts"},
        @{Name="Tests directory"; Path="tests"}
    )
    
    foreach ($check in $checks) {
        if (Test-Path $check.Path) {
            Write-ColorText "✅ $($check.Name)" "Success"
        } else {
            Write-ColorText "❌ $($check.Name) - Missing" "Error"
        }
    }
    
    Write-Host ""
    Write-ColorText "Checking dependencies..." "Info"
    try {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        Write-ColorText "✅ Package.json loaded" "Success"
        Write-Host "• Dependencies: $($packageJson.dependencies.PSObject.Properties.Count)"
        Write-Host "• Dev Dependencies: $($packageJson.devDependencies.PSObject.Properties.Count)"
    } catch {
        Write-ColorText "❌ Package.json issues" "Error"
    }
    
    Write-Host ""
    Write-ColorText "Checking node modules..." "Info"
    if (Test-Path "node_modules") {
        Write-ColorText "✅ Node modules installed" "Success"
    } else {
        Write-ColorText "❌ Node modules missing - Run 'npm install'" "Error"
    }
    
    Write-Host ""
    Read-Host "Press Enter to continue"
}

# Main execution
if ($Help) {
    Show-Help
    exit
}

# Handle command line actions
if ($Action) {
    $networkFlag = Get-NetworkFlag
    
    switch ($Action.ToLower()) {
        "info" { Execute-Command "npx blueprint run get-all-data $networkFlag" "Getting Contract Info" }
        "mint" { Execute-Command "npx blueprint run mint-tokens $networkFlag" "Minting Tokens" }
        "mint-open" { Execute-Command "npx blueprint run mint-open $networkFlag" "Enable Minting" }
        "mint-close" { Execute-Command "npx blueprint run mint-close $networkFlag" "Disable Minting" }
        "burn" { Execute-Command "npx blueprint run burn-operations $networkFlag" "Burn Operations Info" }
        "burn-tokens" { Execute-Command "npx blueprint run token-burn $networkFlag" "Burn Tokens" }
        "transfer" { Execute-Command "npx blueprint run owner-transfer $networkFlag" "Transfer Ownership" }
        "transfer-tokens" { Execute-Command "npx blueprint run token-transfer $networkFlag" "Transfer Tokens" }
        "limits" { Execute-Command "npx blueprint run transaction-limits $networkFlag" "Transaction Limits" }
        "exclusions" { Execute-Command "npx blueprint run address-exclusions $networkFlag" "Address Exclusions" }
        "wallet-ops" { Execute-Command "npx blueprint run wallet-operations $networkFlag" "Wallet Operations" }
        "wallet-address" { Execute-Command "npx blueprint run get-wallet-address $networkFlag" "Get Wallet Address" }
        "update-content" { Execute-Command "npx blueprint run update-content $networkFlag" "Update Content" }
        "deploy" { Execute-Command "npx blueprint run deploytoken $networkFlag" "Deploy Token" }
        "deploy-premint" { Execute-Command "npx blueprint run deploy-premint $networkFlag" "Deploy Preminted Token" }

        "content" { Execute-Command "npx blueprint run content-management $networkFlag" "Content Management" }
        "script-runner" { Execute-Command "npx blueprint run script-runner $networkFlag" "Script Runner" }
        "build" { Execute-Command "npm run build" "Build Contracts" }
        "test" { Execute-Command "npm test" "Run Tests" }
        "setup" { Execute-Command "npx blueprint run setup-env" "Setup Environment" }
        "check-state" { Execute-Command "npx blueprint run check-contract-state $networkFlag" "Check Contract State" }
        default { 
            Write-ColorText "❌ Unknown action: $Action" "Error"
            Write-ColorText "Use -Help to see available actions" "Info"
        }
    }
} else {
    # Show interactive menu
    Show-MainMenu
}

Write-ColorText "Thank you for using RezaToken Contract Control! 👋" "Success"