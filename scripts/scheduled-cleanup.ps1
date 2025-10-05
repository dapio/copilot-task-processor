# ThinkCode AI Platform - Scheduled Cleanup Script
# Ten skrypt można dodać do Windows Task Scheduler do automatycznego czyszczenia

param(
    [Parameter(Mandatory=$false)]
    [string]$Mode = "auto"
)

# Ustaw lokalizację projektu
$PROJECT_ROOT = "C:\Work\WeSub\copilot-task-processor"

Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host "                    🕒 THINKCODE AI - SCHEDULED CLEANUP 🕒" -ForegroundColor Cyan  
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""

# Sprawdź czy projekt istnieje
if (!(Test-Path $PROJECT_ROOT)) {
    Write-Host "❌ Błąd: Projekt nie znaleziony w: $PROJECT_ROOT" -ForegroundColor Red
    exit 1
}

# Przejdź do katalogu projektu
Set-Location $PROJECT_ROOT

Write-Host "🧹 Wykonuję automatyczne czyszczenie systemu..." -ForegroundColor Yellow
Write-Host "📁 Lokalizacja: $PROJECT_ROOT" -ForegroundColor Gray
Write-Host "🕒 Czas: $(Get-Date)" -ForegroundColor Gray
Write-Host ""

try {
    # Uruchom system czyszczenia
    & npx tsx scripts/cleanup-system.ts
    
    Write-Host ""
    Write-Host "✅ Automatyczne czyszczenie zakończone pomyślnie!" -ForegroundColor Green
    
    # Log do pliku
    $logMessage = "$(Get-Date): Scheduled cleanup completed successfully"
    Add-Content -Path "logs/cleanup-schedule.log" -Value $logMessage
    
} catch {
    Write-Host "❌ Błąd podczas czyszczenia: $($_.Exception.Message)" -ForegroundColor Red
    
    # Log błędu do pliku
    $errorMessage = "$(Get-Date): Scheduled cleanup failed - $($_.Exception.Message)"
    Add-Content -Path "logs/cleanup-errors.log" -Value $errorMessage
    
    exit 1
}

Write-Host ""
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host "                           ✨ CLEANUP COMPLETED! ✨" -ForegroundColor Cyan
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""

if ($Mode -eq "interactive") {
    Write-Host "Naciśnij dowolny klawisz, aby kontynuować..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
}