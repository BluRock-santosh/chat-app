# Function to check if Docker is running
function Test-DockerRunning {
    try {
        $null = docker info
        return $true
    }
    catch {
        Write-Host "❌ Docker is not running. Please start Docker Desktop first."
        return $false
    }
}

# Function to clean up containers and volumes
function Clean-Docker {
    Write-Host "🧹 Cleaning up Docker environment..."
    docker-compose down --volumes --remove-orphans
    Start-Sleep -Seconds 10  # Increased wait time for proper cleanup
}

# Function to start services
function Start-Services {
    Write-Host "🚀 Starting services..."
    docker-compose up --build
}

# Function to check service health
function Test-ServiceHealth {
    param (
        [string]$ServiceName,
        [int]$MaxRetries = 30,
        [int]$RetryInterval = 2
    )
    
    $retries = 0
    while ($retries -lt $MaxRetries) {
        $status = docker-compose ps $ServiceName
        if ($status -match "healthy") {
            Write-Host "✅ $ServiceName is healthy"
            return $true
        }
        Write-Host "⏳ Waiting for $ServiceName to be healthy... (Attempt $($retries + 1)/$MaxRetries)"
        Start-Sleep -Seconds $RetryInterval
        $retries++
    }
    Write-Host "❌ $ServiceName failed to become healthy"
    return $false
}

# Function to stop services gracefully
function Stop-Services {
    Write-Host "🛑 Stopping services gracefully..."
    docker-compose stop
    Start-Sleep -Seconds 5
    docker-compose down
}

# Main execution
try {
    if (-not (Test-DockerRunning)) {
        exit 1
    }

    Write-Host "🔄 Starting application..."
    Clean-Docker
    
    # Start services in background
    $job = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        docker-compose up --build
    }
    
    # Wait for services to be healthy
    $services = @("zookeeper", "kafka", "redis", "mongodb")
    foreach ($service in $services) {
        if (-not (Test-ServiceHealth -ServiceName $service)) {
            Write-Host "❌ Service $service failed to start properly"
            Stop-Services
            exit 1
        }
    }
    
    # Show logs
    Receive-Job -Job $job -Wait
}
catch {
    Write-Host "❌ Error: $_"
    Stop-Services
    exit 1
}
finally {
    if ($job) {
        Remove-Job -Job $job
    }
} 