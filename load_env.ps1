# Loads the root .env file variables into the current PowerShell process environment

if (Test-Path ".env") {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#\s]+?)\s*=\s*(.*)\s*$') {
            $name = $Matches[1]
            $value = $Matches[2].Trim()
            if ($value -match '^"(.*)"$' -or $value -match "^'(.*)'$") {
                $value = $Matches[1]
            }
            [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
    Write-Host "✅ Environment variables from .env successfully loaded into this session." -ForegroundColor Green
} else {
    Write-Warning "⚠️ .env file not found in the current directory."
}
