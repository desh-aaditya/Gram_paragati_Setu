# Script to fix incomplete bun package installations
# Run this if you encounter missing package files after bun install

Write-Host "Fixing incomplete bun package installations..." -ForegroundColor Cyan

# Fix picomatch
Write-Host "`nFixing picomatch..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "node_modules\picomatch\lib" -Force | Out-Null
Invoke-WebRequest -Uri "https://unpkg.com/picomatch@4.0.3/index.js" -OutFile "node_modules\picomatch\index.js" -ErrorAction Stop
Invoke-WebRequest -Uri "https://unpkg.com/picomatch@4.0.3/posix.js" -OutFile "node_modules\picomatch\posix.js" -ErrorAction Stop
Invoke-WebRequest -Uri "https://unpkg.com/picomatch@4.0.3/lib/picomatch.js" -OutFile "node_modules\picomatch\lib\picomatch.js" -ErrorAction Stop
Invoke-WebRequest -Uri "https://unpkg.com/picomatch@4.0.3/lib/utils.js" -OutFile "node_modules\picomatch\lib\utils.js" -ErrorAction Stop
Write-Host "✓ picomatch fixed" -ForegroundColor Green

# Fix fdir
Write-Host "`nFixing fdir..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "node_modules\fdir\dist" -Force | Out-Null
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/fdir@6.5.0/dist/index.mjs" -OutFile "node_modules\fdir\dist\index.mjs" -ErrorAction Stop
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/fdir@6.5.0/dist/index.cjs" -OutFile "node_modules\fdir\dist\index.cjs" -ErrorAction Stop
Write-Host "✓ fdir fixed" -ForegroundColor Green

Write-Host "`nAll packages fixed! You can now run 'bun dev'" -ForegroundColor Green




