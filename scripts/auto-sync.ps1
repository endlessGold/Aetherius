# Auto-Sync Script for Aetherius
# Checks for changes every 60 seconds and pushes them to GitHub automatically.

$interval = 60 # Check every 60 seconds

Write-Host "🔄 [Aetherius Auto-Sync] Started. Watching for changes every $interval seconds..." -ForegroundColor Cyan

while ($true) {
    # Check if there are changes (staged or unstaged)
    $status = git status --porcelain
    
    if ($status) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Write-Host "⚡ Changes detected at $timestamp. Syncing..." -ForegroundColor Yellow
        
        # Add all changes
        git add .
        
        # Commit with timestamp
        git commit -m "Auto-sync: $timestamp (Public Terminal Backup)"
        
        # Push to remote
        git push
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Sync complete." -ForegroundColor Green
        } else {
            Write-Host "❌ Sync failed. Please check your connection." -ForegroundColor Red
        }
    }
    
    Start-Sleep -Seconds $interval
}
