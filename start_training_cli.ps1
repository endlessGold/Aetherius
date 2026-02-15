# Aetherius Headless Training Launcher (CLI Version)
# Uses Puppeteer to run the WebGPU training page in a headless browser,
# piping logs directly to this terminal.

Write-Host "Starting Aetherius Training Session (CLI/Headless)..."
Write-Host "1. Cleaning up existing node processes..."
Stop-Process -Name "node" -ErrorAction SilentlyContinue

Write-Host "2. Starting Server (Manual Tick Mode)..."
$env:AETHERIUS_TICK_INTERVAL_MS="0"
Start-Process -FilePath "npm" -ArgumentList "start", "--", "--mode=server" -NoNewWindow

Write-Host "3. Waiting for server to initialize..."
Start-Sleep -Seconds 5

Write-Host "4. Launching Headless Trainer..."
# Pass arguments to the Node script
# You can edit these defaults: duration=240 (min), cycle=200, maxrows=50000
node tools/run_headless.js duration=240 cycle=200 maxrows=50000 backup=60 epochs=3 batch=128

Write-Host "---------------------------------------------------"
Write-Host "Training session ended."
Write-Host "---------------------------------------------------"
