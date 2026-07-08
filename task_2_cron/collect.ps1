$cronDir = "C:\home\cron"
# Fallback to local directory if root C:\ is write-protected due to administrative restrictions
try {
    if (-not (Test-Path $cronDir)) {
        New-Item -ItemType Directory -Path $cronDir -Force | Out-Null
    }
} catch {
    Write-Warning "Failed to create C:\home\cron. Using local fallback folder."
    $cronDir = Join-Path $PSScriptRoot "home\cron"
    if (-not (Test-Path $cronDir)) {
        New-Item -ItemType Directory -Path $cronDir -Force | Out-Null
    }
}

$dateStr = (Get-Date).ToString("MMddyyyy")
$hourStr = (Get-Date).ToString("HH")
$filename = "cron_${dateStr}_${hourStr}.00.csv"
$targetPath = Join-Path $cronDir $filename

Write-Output "[Collection] Starting PowerShell collection to $targetPath..."

$apiRunning = $false
try {
    # Send HTTP request to local Express server
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/submissions" -Method Get -TimeoutSec 3
    if ($response -and $response.success -and $response.data) {
        $apiRunning = $true
        # Parse submissions into CSV format
        $csvLines = @("id,name,email,message,createdAt")
        foreach ($sub in $response.data) {
            # Escape strings for CSV RFC 4180 compatibility
            $escaped = @($sub.id, $sub.name, $sub.email, $sub.message, $sub.createdAt) | ForEach-Object {
                $str = [string]$_
                if ($str.Contains(",") -or $str.Contains('"') -or $str.Contains("`n") -or $str.Contains("`r")) {
                    '"' + $str.Replace('"', '""') + '"'
                } else {
                    $str
                }
            }
            $csvLines += ($escaped -join ",")
        }
        $csvLines | Out-File -FilePath $targetPath -Encoding utf8
        Write-Output "[Collection] Successfully collected data from API."
    }
} catch {
    Write-Warning "[Collection] API offline or error occurred: $_"
}

# Fallback: Copy database directly if server is offline
if (-not $apiRunning) {
    $localCsv = Join-Path $PSScriptRoot "..\data.csv"
    if (Test-Path $localCsv) {
        Copy-Item -Path $localCsv -Destination $targetPath -Force
        Write-Output "[Collection] Fallback: Copied data from local CSV database $localCsv."
    } else {
        # Initialize empty database headers
        "id,name,email,message,createdAt" | Out-File -FilePath $targetPath -Encoding utf8
        Write-Output "[Collection] Initialized empty CSV database at $targetPath."
    }
}
