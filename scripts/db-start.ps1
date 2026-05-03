$ErrorActionPreference = "Stop"

$baseDir = if ($env:MEDLY_POSTGRES_DIR) { $env:MEDLY_POSTGRES_DIR } else { Join-Path $env:USERPROFILE "postgresql-local" }
$pgCtl = Join-Path $baseDir "pgsql\\bin\\pg_ctl.exe"
$dataDir = Join-Path $baseDir "data"
$logFile = Join-Path $baseDir "postgres.log"

if (-not (Test-Path $pgCtl)) {
  throw "PostgreSQL binaries were not found at $pgCtl. Set MEDLY_POSTGRES_DIR or install the local PostgreSQL bundle first."
}

if (-not (Test-Path $dataDir)) {
  throw "PostgreSQL data directory was not found at $dataDir. Initialize the cluster before starting it."
}

$existing = Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1

if ($existing) {
  Write-Host "PostgreSQL is already listening on port 5432 (PID $($existing.OwningProcess))."
  exit 0
}

& $pgCtl -D $dataDir -l $logFile -o " -p 5432 " start | Out-Host
Start-Sleep -Seconds 2

$listener = Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1

if (-not $listener) {
  throw "PostgreSQL did not start successfully. Check $logFile for details."
}

Write-Host "PostgreSQL is now running on localhost:5432."
