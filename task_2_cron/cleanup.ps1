$cronDir = "C:\home\cron"
if (-not (Test-Path $cronDir)) {
    $cronDir = Join-Path $PSScriptRoot "home\cron"
}

if (-not (Test-Path $cronDir)) {
    Write-Output "[Cleansing] Directory $cronDir does not exist. Nothing to clean."
    exit 0
}

Write-Output "[Cleansing] Initiating cleanup process in $cronDir..."
$now = Get-Date
$limitDays = 30
$deletedCount = 0

$files = Get-ChildItem -Path $cronDir -Filter "cron_*"

foreach ($file in $files) {
    if ($file.Attributes -match "Directory") { continue }
    
    $fileDate = $null
    
    # Try parsing date from filename (format: cron_MMDDYYYY_HH.mm.csv)
    if ($file.Name -match "^cron_(\d{2})(\d{2})(\d{4})_(\d{2})\.(\d{2})(?:\.csv)?$") {
        $month = [int]$Matches[1]
        $day = [int]$Matches[2]
        $year = [int]$Matches[3]
        $hour = [int]$Matches[4]
        $minute = [int]$Matches[5]
        
        try {
            $fileDate = New-Object DateTime $year, $month, $day, $hour, $minute, 0
        } catch {
            $fileDate = $file.LastWriteTime
        }
    } else {
        $fileDate = $file.LastWriteTime
    }
    
    $age = $now - $fileDate
    if ($age.TotalDays -gt $limitDays) {
        try {
            Remove-Item -Path $file.FullName -Force
            Write-Output ("[Cleansing] Deleted expired file: " + $file.Name + " (Age: " + $age.TotalDays.ToString("F1") + " days)")
            $deletedCount++
        } catch {
            Write-Error "[Cleansing] Failed to delete file $($file.Name): $_"
        }
    }
}

Write-Output "[Cleansing] Cleanup process finished. Deleted $deletedCount file(s)."
