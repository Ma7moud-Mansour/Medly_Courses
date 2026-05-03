$ErrorActionPreference = "Stop"

$baseDir = if ($env:MEDLY_POSTGRES_DIR) { $env:MEDLY_POSTGRES_DIR } else { Join-Path $env:USERPROFILE "postgresql-local" }
$pgCtl = Join-Path $baseDir "pgsql\\bin\\pg_ctl.exe"
$dataDir = Join-Path $baseDir "data"

if (-not (Test-Path $pgCtl) -or -not (Test-Path $dataDir)) {
  throw "PostgreSQL local installation was not found. Set MEDLY_POSTGRES_DIR if you installed it elsewhere."
}

& $pgCtl -D $dataDir stop | Out-Host
