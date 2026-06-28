#!/bin/bash

# EventOS Staging Chaos & Failover Validation Drills
# Simulates container failures and verifies high availability and recovery.

set -euo pipefail

DRY_RUN=false
TARGET_SERVICE="event-service"
GATEWAY_URL="http://localhost:8080/api/v1"

usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  -s, --service    Microservice target for termination (default: 'event-service')."
  echo "  -g, --gateway    API Gateway base URL (default: 'http://localhost:8080/api/v1')."
  echo "  -d, --dry-run    Validate script syntax without killing container instances."
  exit 1
}

# Parse Args
while [[ $# -gt 0 ]]; do
  case $1 in
    -s|--service)
      TARGET_SERVICE="$2"
      shift 2
      ;;
    -g|--gateway)
      GATEWAY_URL="$2"
      shift 2
      ;;
    -d|--dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      usage
      ;;
  esac
done

echo "=============================================="
echo "EVENTOS STAGING DRILL: CHAOS & FAILOVER"
echo "Target Service : $TARGET_SERVICE"
echo "Gateway URL    : $GATEWAY_URL"
echo "Dry Run Mode   : $DRY_RUN"
echo "=============================================="

# Helper function to check availability
ping_gateway_health() {
  local endpoint="$1"
  local expected_status="${2:-200}"
  
  if [ "$DRY_RUN" = "true" ]; then
    echo "[DRY-RUN] curl -s -o /dev/null -w '%{http_code}' $endpoint"
    return 0
  fi
  
  local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint")
  if [ "$status_code" -eq "$expected_status" ]; then
    return 0 # Success
  else
    return 1 # Failed
  fi
}

# 1. Verify Staging Baseline Health
echo "1. Validating baseline staging health..."
if ping_gateway_health "$GATEWAY_URL/events/bookings/actuator/health"; then
  echo "SUCCESS: Baseline health is UP."
else
  echo "WARNING: Baseline health check failed. Gateway or services might be down."
fi
echo "----------------------------------------------"

# 2. Simulate Container Crash (Service Outage Container Kill)
echo "2. Simulating $TARGET_SERVICE container crash..."
CONTAINER_NAME="eventos-$TARGET_SERVICE"

if [ "$DRY_RUN" = "true" ]; then
  echo "[DRY-RUN] docker kill $CONTAINER_NAME"
  echo "[DRY-RUN] Sleep 5"
else
  # Verify container is running
  if docker ps --filter "name=$CONTAINER_NAME" --filter "status=running" | grep -q "$CONTAINER_NAME"; then
    echo "Killing container: $CONTAINER_NAME..."
    docker kill "$CONTAINER_NAME"
    echo "Container killed. Simulating outage gap..."
    sleep 3
  else
    echo "WARNING: Docker container $CONTAINER_NAME is not running. Checking Kubernetes..."
    if command -v kubectl &> /dev/null; then
      echo "Terminating K8s Pod matching label app=$TARGET_SERVICE..."
      kubectl delete pod -l "app=$TARGET_SERVICE" -n eventos --grace-period=0 --force
      sleep 3
    else
      echo "WARNING: Neither Docker container nor K8s commands available. Outage skip."
    fi
  fi
fi

# 3. Verify System Resiliency During Outage
echo "3. Verifying failover availability during service recovery..."
if ping_gateway_health "$GATEWAY_URL/events/bookings/actuator/health"; then
  echo "SUCCESS: High availability confirmed. Replicas handled the request."
else
  echo "NOTICE: Service degraded as expected during replica termination."
fi
echo "----------------------------------------------"

# 4. Verify Auto-Heal Recovery
echo "4. Checking auto-healing restoration..."
if [ "$DRY_RUN" = "true" ]; then
  echo "[DRY-RUN] Wait for container restart policy to trigger..."
else
  echo "Waiting 25 seconds for restart policies/probes to restore health..."
  sleep 25
  
  # Check if container recovered
  if docker ps --filter "name=$CONTAINER_NAME" --filter "status=running" | grep -q "$CONTAINER_NAME"; then
    echo "SUCCESS: Docker auto-restart policy recovered the container."
  else
    if command -v kubectl &> /dev/null; then
      # Check K8s rollout recovery
      local ready_replicas=$(kubectl get deployment/"$TARGET_SERVICE" -n eventos -o jsonpath='{.status.readyReplicas}')
      echo "Kubernetes reports $ready_replicas active ready replicas for $TARGET_SERVICE."
    else
      echo "NOTICE: Auto-recovery status unverified. Confirm manual restart commands."
    fi
  fi
fi

echo "=============================================="
echo "FAILOVER & RESILIENCY DRILL COMPLETE"
echo "=============================================="
