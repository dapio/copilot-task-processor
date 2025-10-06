# PowerShell script to fix unused parameters in TypeScript files
# This script adds underscore prefix to unused parameters

$filePatterns = @(
    "src/**/*.ts"
)

$replacements = @(
    # Common patterns for unused parameters
    @{
        Pattern = '\(req: Request,'
        Replacement = '(_req: Request,'
    },
    @{
        Pattern = '\(([a-zA-Z_$][a-zA-Z0-9_$]*): Request,'
        Replacement = '(_$1: Request,'
    },
    @{
        Pattern = ', req: Request,'
        Replacement = ', _req: Request,'
    },
    @{
        Pattern = ', res: Response,'
        Replacement = ', _res: Response,'
    },
    @{
        Pattern = ', next: NextFunction'
        Replacement = ', _next: NextFunction'
    },
    @{
        Pattern = 'async \(([a-zA-Z_$][a-zA-Z0-9_$]*): string,'
        Replacement = 'async (_$1: string,'
    },
    @{
        Pattern = 'async \(([a-zA-Z_$][a-zA-Z0-9_$]*): any'
        Replacement = 'async (_$1: any'
    }
)

# Get all TypeScript files
$files = Get-ChildItem -Path "src" -Recurse -Filter "*.ts" -File

foreach ($file in $files) {
    Write-Host "Processing: $($file.FullName)"
    
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Apply each replacement pattern
    foreach ($replacement in $replacements) {
        $content = $content -replace $replacement.Pattern, $replacement.Replacement
    }
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  Updated: $($file.Name)"
    }
}

Write-Host "Unused parameters fix complete!"