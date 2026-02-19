param(
  [string]$RepoUrl = "https://github.com/endlessGold/Aetherius",
  [string]$CloneDir = (Join-Path (Get-Location) "Aetherius")
)
$ErrorActionPreference = "Stop"
function InstallPackage($id) {
  winget install --id $id -e --source winget --accept-package-agreements --accept-source-agreements
}
function EnsureGit() {
  $gitCmd = Get-Command git -ErrorAction SilentlyContinue
  if (-not $gitCmd) { InstallPackage "Git.Git" }
  $global:GitPath = "C:\Progra~1\Git\cmd\git.exe"
  if (-not (Test-Path $global:GitPath)) {
    $gitCmd = Get-Command git -ErrorAction SilentlyContinue
    if ($gitCmd) { $global:GitPath = $gitCmd.Source }
  }
}
function EnsureGh() {
  if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { InstallPackage "GitHub.cli" }
  $global:GhPath = $null
  $ghCmd = Get-Command gh -ErrorAction SilentlyContinue
  if ($ghCmd) { $global:GhPath = $ghCmd.Source }
  if (-not $global:GhPath) {
    $candidates = @(
      (Join-Path $env:ProgramFiles "gh\bin\gh.exe"),
      (Join-Path $env:LOCALAPPDATA "Programs\gh\bin\gh.exe")
    )
    foreach ($p in $candidates) {
      if (Test-Path $p) { $global:GhPath = $p; break }
    }
  }
}
function EnsureNode() {
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) { InstallPackage "OpenJS.NodeJS.LTS" }
}
EnsureGit
EnsureGh
EnsureNode
$env:PATH = "C:\Program Files\nodejs;$env:PATH"
if (-not (Test-Path $CloneDir)) { New-Item -ItemType Directory -Path $CloneDir | Out-Null }
Set-Location $CloneDir
& $GitPath init
& $GitPath remote add origin $RepoUrl
& $GitPath sparse-checkout init --cone
& $GitPath sparse-checkout set package.json package-lock.json tsconfig.json README.md src docs public vercel.json tools
& $GitPath fetch origin main
& $GitPath restore --source=origin/main -- package.json package-lock.json tsconfig.json README.md src docs public vercel.json tools
if ($global:GhPath) { & $global:GhPath auth login --hostname github.com --web }
$npmPath = "C:\Program Files\nodejs\npm.cmd"
if (Test-Path ".\\package-lock.json") {
  if (Test-Path $npmPath) { & $npmPath ci } else { npm ci }
} else {
  if (Test-Path $npmPath) { & $npmPath install } else { npm install }
}
