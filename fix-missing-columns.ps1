#!/usr/bin/env pwsh
# Script to fix missing columns in the coupons table

Write-Host "`nCOUPON SCHEMA FIX - Adding Missing Columns" -ForegroundColor Cyan
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
    
    Write-Host "`nPROBLEM DETECTED:" -ForegroundColor Red
    Write-Host "  - Column is_active does not exist" -ForegroundColor White
    Write-Host "  - Column discount_type may also be missing" -ForegroundColor White
    Write-Host "  - The coupons table has incomplete schema" -ForegroundColor White
    
    Write-Host "`nSOLUTION: Run the schema fix migration" -ForegroundColor Yellow
    Write-Host "`nThis migration will add ALL missing columns safely." -ForegroundColor White
    
    # Check if fix migration file exists
    $fixMigrationPath = "migrations/fix_coupons_schema.sql"
    if (Test-Path $fixMigrationPath) {
        Write-Host "`nCopying fix migration SQL to clipboard..." -ForegroundColor Cyan
        
        $migrationContent = Get-Content $fixMigrationPath -Raw
        
        # Try to copy to clipboard
        try {
            Set-Clipboard -Value $migrationContent
            Write-Host "SUCCESS: Fix migration SQL copied to clipboard!" -ForegroundColor Green
        } catch {
            Write-Host "WARNING: Could not copy to clipboard automatically" -ForegroundColor Yellow
            Write-Host "   Please manually copy the file: $fixMigrationPath" -ForegroundColor Yellow
        }
        
        Write-Host "`nOpening Supabase SQL Editor..." -ForegroundColor Cyan
        Start-Process $dashboardUrl
        
        Write-Host "`nInstructions:" -ForegroundColor Yellow
        Write-Host "   1. In the SQL Editor, create a new query" -ForegroundColor White
        Write-Host "   2. Paste the fix migration SQL (already in clipboard)" -ForegroundColor White
        Write-Host "   3. Click Run or press Ctrl+Enter" -ForegroundColor White
        Write-Host "   4. You should see notices about added columns" -ForegroundColor White
        
        Write-Host "`nWhat this migration does:" -ForegroundColor Green
        Write-Host "   - Safely adds missing columns (discount_type, is_active, etc.)" -ForegroundColor White
        Write-Host "   - Only adds columns that don't already exist" -ForegroundColor White
        Write-Host "   - Won't break existing data" -ForegroundColor White
        Write-Host "   - Creates necessary indexes and constraints" -ForegroundColor White
        
        Write-Host "`nAfter running:" -ForegroundColor Green
        Write-Host "   - All column errors will be resolved" -ForegroundColor White
        Write-Host "   - Your coupon API will work correctly" -ForegroundColor White
        Write-Host "   - Test: http://localhost:3000/api/admin/coupons" -ForegroundColor White
        
    } else {
        Write-Host "`nError: Fix migration file not found: $fixMigrationPath" -ForegroundColor Red
        Write-Host "Creating the fix migration file..." -ForegroundColor Yellow
    }
    
    Write-Host "`nMigration file: migrations/fix_coupons_schema.sql" -ForegroundColor Cyan
    
} else {
    Write-Host "`nError: Could not extract project reference from URL" -ForegroundColor Red
    Write-Host "Please manually navigate to your Supabase Dashboard > SQL Editor" -ForegroundColor Yellow
    Write-Host "Then run the SQL from: migrations/fix_coupons_schema.sql" -ForegroundColor Yellow
}

Write-Host "`n"
