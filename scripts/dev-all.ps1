$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$webDir = Join-Path $root '3d-jobs-web'
$mobileDir = Join-Path $root '3d-jobs-mobile'
$webCli = Join-Path $webDir 'node_modules\next\dist\bin\next'
$mobileCli = Join-Path $root 'node_modules\expo\bin\cli'

$ports = 3000, 8081
Get-NetTCPConnection -LocalPort $ports -State Listen -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }

$webProcess = Start-Process -FilePath 'node' -ArgumentList "`"$webCli`" dev" -WorkingDirectory $webDir -NoNewWindow -PassThru
$mobileProcess = Start-Process -FilePath 'node' -ArgumentList "`"$mobileCli`" start" -WorkingDirectory $mobileDir -NoNewWindow -PassThru

Wait-Process -Id $webProcess.Id, $mobileProcess.Id
