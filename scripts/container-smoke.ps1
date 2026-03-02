param(
  [switch]$KeepUp
)

$ErrorActionPreference = 'Stop'

function Resolve-DockerCli {
  $command = Get-Command docker -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  $defaultPath = 'C:\Program Files\Docker\Docker\resources\bin\docker.exe'
  if (Test-Path $defaultPath) {
    return $defaultPath
  }

  throw 'docker CLI not found. Install Docker Desktop or add docker to PATH.'
}

function Invoke-Docker {
  param(
    [string[]]$DockerArgs
  )

  & $script:DockerCli @DockerArgs
}

function Wait-ForHttpOk {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 120
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
        return $response
      }
    } catch {
      Start-Sleep -Seconds 2
      continue
    }

    Start-Sleep -Seconds 2
  } while ((Get-Date) -lt $deadline)

  throw "Timed out waiting for HTTP success from $Url"
}

function Wait-ForServiceHealth {
  param(
    [string]$Service,
    [int]$TimeoutSeconds = 120
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    $containerId = (Invoke-Docker -DockerArgs @('compose', 'ps', '-q', $Service) | Select-Object -First 1).Trim()
    if ($containerId) {
      $state = (& $script:DockerCli inspect '--format' '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' $containerId).Trim()
      if ($state -eq 'healthy' -or $state -eq 'running') {
        return
      }
    }

    Start-Sleep -Seconds 2
  } while ((Get-Date) -lt $deadline)

  throw "Timed out waiting for service health: $Service"
}

$script:DockerCli = Resolve-DockerCli
$dockerBin = Split-Path -Parent $script:DockerCli
if ($env:PATH -notlike "*$dockerBin*") {
  $env:PATH = "$dockerBin;$env:PATH"
}
$env:DOCKER_BUILDKIT = '0'
$env:COMPOSE_DOCKER_CLI_BUILD = '0'
$env:COMPOSE_BAKE = 'false'
$repoRoot = Split-Path -Parent $PSScriptRoot

Push-Location $repoRoot
try {
  Write-Host 'Starting container smoke validation...'
  Invoke-Docker -DockerArgs @('compose', 'down', '--remove-orphans') | Out-Null
  Invoke-Docker -DockerArgs @('compose', 'up', '--build', '-d')
  if ($LASTEXITCODE -ne 0) {
    throw 'docker compose up failed'
  }

  $apiResponse = Wait-ForHttpOk -Url 'http://localhost:4000/api/v1/health'
  $webResponse = Wait-ForHttpOk -Url 'http://localhost:3000'
  Wait-ForServiceHealth -Service 'postgres'
  Wait-ForServiceHealth -Service 'redis'
  Wait-ForServiceHealth -Service 'api'
  Wait-ForServiceHealth -Service 'web'
  $composePs = Invoke-Docker -DockerArgs @('compose', 'ps')
  if ($LASTEXITCODE -ne 0) {
    throw 'docker compose ps failed'
  }

  Write-Host ''
  Write-Host 'Container smoke validation passed.'
  Write-Host "API health response: $($apiResponse.Content)"
  Write-Host "Web status code: $($webResponse.StatusCode)"
  Write-Host $composePs
} finally {
  if (-not $KeepUp) {
    Write-Host ''
    Write-Host 'Stopping compose stack...'
    Invoke-Docker -DockerArgs @('compose', 'down')
  }
  Pop-Location
}
