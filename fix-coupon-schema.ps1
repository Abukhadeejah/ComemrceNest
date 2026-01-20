#!/usr/bin/env pwsh
# Script to help fix the missing discount_type column issue

Write-Host "`nCOUPON SCHEMA FIX HELPER" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Cyan

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "`nError: .env.local file not found" -ForegroundColor Red
    Write-Host "Please create .env.local with your Supabase credentials" -ForegroundColor Yellow
    exit 1
}

# Load environment variables
Get-Content ".env.local" | ForEach-Object {
    if ($_ -match '^([^=]+)=(.+)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $value, [System.EnvironmentVariableTarget]::Process)
    }
}

$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL

if (-not $supabaseUrl) {
    Write-Host "`nError: NEXT_PUBLIC_SUPABASE_URL not found in .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "`nFound Supabase URL: $supabaseUrl" -ForegroundColor Green

# Extract project reference from URL
if ($supabaseUrl -match 'https://([^.]+)\.supabase\.co') {
    $projectRef = $matches[1]
    $dashboardUrl = "https://supabase.com/dashboard/project/$projectRef/editor"
    
    Write-Host "`nSOLUTION: Run the migration in Supabase SQL Editor" -ForegroundColor Yellow
    Write-Host "`nFollow these steps:" -ForegroundColor White
    Write-Host "1. Open Supabase SQL Editor (opening in browser...)" -ForegroundColor Cyan
    Write-Host "2. Copy the migration SQL (will be copied to clipboard)" -ForegroundColor Cyan
    Write-Host "3. Paste into SQL Editor and click Run" -ForegroundColor Cyan
    
    Write-Host "`nMigration file: migrations/create_coupons_system.sql" -ForegroundColor White
    
    # Check if migration file exists
    $migrationPath = "migrations/create_coupons_system.sql"
    if (Test-Path $migrationPath) {
        Write-Host "`nCopying migration SQL to clipboard..." -ForegroundColor Cyan
        
        $migrationContent = Get-Content $migrationPath -Raw
        
        # Try to copy to clipboard
        try {
            Set-Clipboard -Value $migrationContent
            Write-Host "SUCCESS: Migration SQL copied to clipboard!" -ForegroundColor Green
        } catch {
            Write-Host "WARNING: Could not copy to clipboard automatically" -ForegroundColor Yellow
            Write-Host "   Please manually copy the file: $migrationPath" -ForegroundColor Yellow
        }
        
        Write-Host "`nOpening Supabase SQL Editor..." -ForegroundColor Cyan
        Start-Process $dashboardUrl
        
        Write-Host "`nManual Instructions:" -ForegroundColor Yellow
        Write-Host "   1. In the SQL Editor, create a new query" -ForegroundColor White
        Write-Host "   2. Paste the migration SQL (already in clipboard)" -ForegroundColor White
        Write-Host "   3. Click Run or press Ctrl+Enter" -ForegroundColor White
        Write-Host "   4. Verify you see Success message" -ForegroundColor White
        
        Write-Host "`nAfter running the migration:" -ForegroundColor Green
        Write-Host "   - The discount_type column will be added" -ForegroundColor White
        Write-Host "   - Your API endpoints will work correctly" -ForegroundColor White
        Write-Host "   - Test with: http://localhost:3000/api/admin/coupons" -ForegroundColor White
        
    } else {
        Write-Host "`nError: Migration file not found: $migrationPath" -ForegroundColor Red
    }
    
    Write-Host "`nFor detailed instructions, see: COUPON_SCHEMA_FIX.md" -ForegroundColor Cyan
    
} else {
    Write-Host "`nError: Could not extract project reference from URL" -ForegroundColor Red
    Write-Host "Please manually navigate to your Supabase Dashboard > SQL Editor" -ForegroundColor Yellow
}

Write-Host "`n" -NoNewline
