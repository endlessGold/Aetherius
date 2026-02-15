# Aetherius Training Launcher
# This script starts the server in high-performance mode (no auto-tick)
# and launches the WebGPU-enabled training page in the default browser.

Write-Host "Starting Aetherius Training Session..."
Write-Host "1. Cleaning up existing node processes..."
Stop-Process -Name "node" -ErrorAction SilentlyContinue

Write-Host "2. Starting Server (Manual Tick Mode for Data Generation)..."
$env:AETHERIUS_TICK_INTERVAL_MS="0"
Start-Process -FilePath "npm" -ArgumentList "start", "--", "--mode=server" -NoNewWindow

Write-Host "3. Waiting for server to initialize..."
Start-Sleep -Seconds 5

# Configuration (4 Hours = 240 min)
$baseUrl = "http://localhost:3000/tools/dataset.html"
$params = "?autorun=true&duration=240&cycle=200&maxrows=50000&backup=60&epochs=3&batch=128"

$targetUrl = "$baseUrl$params"

Write-Host "4. Launching Training Interface: $targetUrl"
Start-Process $targetUrl

Write-Host "---------------------------------------------------"
Write-Host "Training is running in the browser (WebGPU)."
Write-Host "Do NOT close the browser tab or this server window."
Write-Host "To stop, press Ctrl+C in this window."
Write-Host "---------------------------------------------------"
