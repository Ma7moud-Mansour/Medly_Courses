$ErrorActionPreference = "Stop"

$baseDir = if ($env:MEDLY_POSTGRES_DIR) { $env:MEDLY_POSTGRES_DIR } else { Join-Path $env:USERPROFILE "postgresql-local" }
$pgCtl = Join-Path $baseDir "pgsql\\bin\\pg_ctl.exe"
$dataDir = Join-Path $baseDir "data"

if (-not (Test-Path $pgCtl) -or -not (Test-Path $dataDir)) {
  throw "PostgreSQL local installation was not found. Set MEDLY_POSTGRES_DIR if you installed it elsewhere."
}

& $pgCtl -D $dataDir status | Out-Host
$listener = Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 LocalAddress, LocalPort, OwningProcess, State

if ($listener) {
  $listener | Format-Table -AutoSize | Out-Host
} else {
  Write-Host "No PostgreSQL listener is currently bound to port 5432."
}
