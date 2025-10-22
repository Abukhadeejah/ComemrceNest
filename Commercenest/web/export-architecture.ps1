# ============================================
# Next.js + Supabase Project Architecture Exporter
# Auto-detects current directory
# ============================================

# Automatically use the current directory where script is located
$ProjectRoot = $PSScriptRoot
if ([string]::IsNullOrEmpty($ProjectRoot)) {
    $ProjectRoot = Get-Location
}

$OutputFolder = Join-Path -Path $ProjectRoot -ChildPath "architecture-export"

# Create output folder if it doesn't exist
if (!(Test-Path -Path $OutputFolder)) {
    New-Item -ItemType Directory -Path $OutputFolder | Out-Null
}

# Folders to exclude (common Next.js/Node.js build and dependency folders)
$ExcludeFolders = @(
    'node_modules',
    '.next',
    '.git',
    'dist',
    'build',
    '.vercel',
    '.turbo',
    'out',
    'coverage',
    '.cache',
    'architecture-export'
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Next.js + Supabase Architecture Exporter" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Project: $ProjectRoot" -ForegroundColor Green
Write-Host "Output: $OutputFolder" -ForegroundColor Green
Write-Host ""

# ============================================
# 1. Export Project Structure (Folders Only)
# ============================================
Write-Host "[1/7] Exporting folder structure..." -ForegroundColor Yellow

function Get-DirectoryTree {
    param(
        [string]$Path,
        [string]$Indent = "",
        [string[]]$Exclude
    )
    
    $items = Get-ChildItem -Path $Path -Directory -ErrorAction SilentlyContinue | 
             Where-Object { $_.Name -notin $Exclude }
    
    foreach ($item in $items) {
        Write-Output "$Indent+-- $($item.Name)"
        Get-DirectoryTree -Path $item.FullName -Indent "$Indent|   " -Exclude $Exclude
    }
}

$folderStructure = "Project Root: $ProjectRoot`n=====================================`n`n"
$folderStructure += Get-DirectoryTree -Path $ProjectRoot -Exclude $ExcludeFolders

$folderStructure | Out-File -FilePath "$OutputFolder\01-folder-structure.txt" -Encoding UTF8
Write-Host "      [OK] Saved: 01-folder-structure.txt" -ForegroundColor Green

# ============================================
# 2. Export Complete File Tree (with files)
# ============================================
Write-Host "[2/7] Exporting complete file tree..." -ForegroundColor Yellow

function Get-FileTree {
    param(
        [string]$Path,
        [string]$Indent = "",
        [string[]]$Exclude
    )
    
    $items = Get-ChildItem -Path $Path -ErrorAction SilentlyContinue | 
             Where-Object { $_.Name -notin $Exclude }
    
    foreach ($item in $items) {
        if ($item.PSIsContainer) {
            Write-Output "$Indent+-- [$($item.Name)]"
            Get-FileTree -Path $item.FullName -Indent "$Indent|   " -Exclude $Exclude
        } else {
            Write-Output "$Indent+-- $($item.Name)"
        }
    }
}

$fileTree = "Complete File Tree: $ProjectRoot`n=====================================`n`n"
$fileTree += Get-FileTree -Path $ProjectRoot -Exclude $ExcludeFolders

$fileTree | Out-File -FilePath "$OutputFolder\02-complete-file-tree.txt" -Encoding UTF8
Write-Host "      [OK] Saved: 02-complete-file-tree.txt" -ForegroundColor Green

# ============================================
# 3. Export File Inventory with Details
# ============================================
Write-Host "[3/7] Exporting detailed file inventory..." -ForegroundColor Yellow

$fileInventory = Get-ChildItem -Path $ProjectRoot -Recurse -File -ErrorAction SilentlyContinue | 
    Where-Object { 
        $exclude = $false
        foreach ($folder in $ExcludeFolders) {
            if ($_.FullName -like "*\$folder\*") {
                $exclude = $true
                break
            }
        }
        -not $exclude
    } | Select-Object @{
        Name='RelativePath'
        Expression={ $_.FullName.Replace($ProjectRoot, '.') }
    }, 
    @{
        Name='Extension'
        Expression={ $_.Extension }
    },
    @{
        Name='SizeKB'
        Expression={ [math]::Round($_.Length / 1KB, 2) }
    },
    LastWriteTime | 
    Export-Csv -Path "$OutputFolder\03-file-inventory.csv" -NoTypeInformation -Encoding UTF8

Write-Host "      [OK] Saved: 03-file-inventory.csv" -ForegroundColor Green

# ============================================
# 4. Export Configuration Files
# ============================================
Write-Host "[4/7] Exporting configuration file list..." -ForegroundColor Yellow

$configPatterns = @(
    'package.json',
    'next.config.*',
    'tsconfig.json',
    'tailwind.config.*',
    '.env*',
    '.eslintrc*',
    '.prettierrc*',
    'vercel.json',
    'Dockerfile*',
    '.gitignore',
    'middleware.ts',
    'middleware.js'
)

$configFiles = @()
foreach ($pattern in $configPatterns) {
    $found = Get-ChildItem -Path $ProjectRoot -Filter $pattern -File -ErrorAction SilentlyContinue
    $configFiles += $found
}

$configList = "Configuration Files Found`n=====================================`n`n"
$configFiles | ForEach-Object {
    $configList += "[+] $($_.Name)`n"
}

$configList | Out-File -FilePath "$OutputFolder\04-config-files.txt" -Encoding UTF8
Write-Host "      [OK] Saved: 04-config-files.txt" -ForegroundColor Green

# ============================================
# 5. Export Key Directories Summary
# ============================================
Write-Host "[5/7] Analyzing key directories..." -ForegroundColor Yellow

$keyDirs = @('app', 'pages', 'components', 'lib', 'utils', 'api', 'public', 'src', 'styles', 'hooks', 'context', 'types', 'supabase')
$dirSummary = "Key Directories Analysis`n=====================================`n`n"

foreach ($dir in $keyDirs) {
    $dirPath = Join-Path -Path $ProjectRoot -ChildPath $dir
    if (Test-Path -Path $dirPath) {
        $fileCount = (Get-ChildItem -Path $dirPath -Recurse -File -ErrorAction SilentlyContinue).Count
        $dirSummary += "[+] /$dir - $fileCount files`n"
    } else {
        $dirSummary += "[-] /$dir - Not found`n"
    }
}

$dirSummary | Out-File -FilePath "$OutputFolder\05-key-directories.txt" -Encoding UTF8
Write-Host "      [OK] Saved: 05-key-directories.txt" -ForegroundColor Green

# ============================================
# 6. Export Code Statistics
# ============================================
Write-Host "[6/7] Calculating code statistics..." -ForegroundColor Yellow

$codeExtensions = @{
    'TypeScript' = @('*.ts', '*.tsx')
    'JavaScript' = @('*.js', '*.jsx')
    'CSS/Styling' = @('*.css', '*.scss', '*.sass', '*.less')
    'Config' = @('*.json', '*.yaml', '*.yml')
    'Markdown' = @('*.md')
    'SQL' = @('*.sql')
}

$stats = "Code Statistics`n=====================================`n`n"

foreach ($category in $codeExtensions.Keys) {
    $count = 0
    foreach ($ext in $codeExtensions[$category]) {
        $files = Get-ChildItem -Path $ProjectRoot -Recurse -Filter $ext -File -ErrorAction SilentlyContinue |
            Where-Object { 
                $exclude = $false
                foreach ($folder in $ExcludeFolders) {
                    if ($_.FullName -like "*\$folder\*") {
                        $exclude = $true
                        break
                    }
                }
                -not $exclude
            }
        $count += $files.Count
    }
    $stats += "$category : $count files`n"
}

$stats | Out-File -FilePath "$OutputFolder\06-code-statistics.txt" -Encoding UTF8
Write-Host "      [OK] Saved: 06-code-statistics.txt" -ForegroundColor Green

# ============================================
# 7. Create Summary Report
# ============================================
Write-Host "[7/7] Generating summary report..." -ForegroundColor Yellow

$summary = @"
PROJECT ARCHITECTURE EXPORT SUMMARY
=====================================
Project: $ProjectRoot
Export Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

FILES GENERATED:
[+] 01-folder-structure.txt - Directory hierarchy (folders only)
[+] 02-complete-file-tree.txt - Complete file and folder tree
[+] 03-file-inventory.csv - Detailed file listing with metadata
[+] 04-config-files.txt - All configuration files
[+] 05-key-directories.txt - Key Next.js directories analysis
[+] 06-code-statistics.txt - Code file statistics by type

EXCLUDED FOLDERS:
$($ExcludeFolders -join ', ')

NEXT STEPS:
=====================================
For Supabase database schema export:

Option 1 - Using Supabase CLI:
  supabase db dump -f architecture-export/07-supabase-schema.sql

Option 2 - Using pg_dump:
  pg_dump "your_connection_string" --schema-only > architecture-export/07-supabase-schema.sql

=====================================
All architecture files are ready for documentation!
=====================================
"@

$summary | Out-File -FilePath "$OutputFolder\00-README.txt" -Encoding UTF8
Write-Host "      [OK] Saved: 00-README.txt" -ForegroundColor Green

# ============================================
# Complete
# ============================================
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "       EXPORT COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Output Location:" -ForegroundColor Cyan
Write-Host "  $OutputFolder" -ForegroundColor White
Write-Host ""
Write-Host "7 files generated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Opening export folder..." -ForegroundColor Yellow

# Open the output folder
Start-Process $OutputFolder
