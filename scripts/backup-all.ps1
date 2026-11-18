# Full backup in one go: originals to the local folder, every table + media map,
# and the Supabase mirror used by the emergency switch. Run by the "Kzora Backup"
# scheduled task daily; safe to run by hand any time:
#   powershell -ExecutionPolicy Bypass -File scripts\backup-all.ps1
$ErrorActionPreference = 'Continue'
Set-Location (Split-Path $PSScriptRoot -Parent)
$target = Join-Path $env:USERPROFILE 'Desktop\Kzora-media-backup'
New-Item -ItemType Directory -Force $target | Out-Null
$log = Join-Path $target 'backup-log.txt'

"===== $(Get-Date -Format 'yyyy-MM-dd HH:mm') =====" | Out-File $log -Append -Encoding utf8
foreach ($s in 'download-media-originals.mjs', 'backup-database.mjs', 'backup-media-to-supabase.mjs') {
  "--- $s" | Out-File $log -Append -Encoding utf8
  & node "scripts\$s" *>&1 | Select-Object -Last 6 | Out-File $log -Append -Encoding utf8
  if ($LASTEXITCODE -ne 0) { "!! $s FAILED (exit $LASTEXITCODE)" | Out-File $log -Append -Encoding utf8 }
}
