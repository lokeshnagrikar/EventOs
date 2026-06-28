#!/bin/bash

# EventOS Local Security Scanner Wrapper
# Runs Trivy container scans, Gitleaks checks, and dependency auditing.

set -euo pipefail

DRY_RUN=false
IMAGE_TAG="latest"

usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  -t, --tag       Specify target Docker image tag. Defaults to 'latest'."
  echo "  -d, --dry-run   Simulate execution commands without running actual scans."
  exit 1
}

# Parse Args
while [[ $# -gt 0 ]]; do
  case $1 in
    -t|--tag)
      IMAGE_TAG="$2"
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
echo "EVENTOS SECURITY RUNTIME SCANNER"
echo "Target Image Tag: $IMAGE_TAG"
echo "Dry Run Mode    : $DRY_RUN"
echo "=============================================="

# 1. Check for Secrets Leakage (Gitleaks)
run_gitleaks_scan() {
  echo "1. Initializing Secrets Leakage Check (Gitleaks)..."
  if [ "$DRY_RUN" = "true" ]; then
    echo "[DRY-RUN] gitleaks detect --source=. --verbose"
  else
    if command -v gitleaks &> /dev/null; then
      gitleaks detect --source="." --verbose || {
        echo "CRITICAL: Gitleaks detected secrets exposed in git history!"
        exit 1
      }
      echo "SUCCESS: Gitleaks scan completed. No secrets detected."
    else
      echo "WARNING: Gitleaks binary not found on path. Skipping local execution."
      echo "Ensure Gitleaks is installed or validated in CI/CD pipeline."
    fi
  fi
  echo "----------------------------------------------"
}

# 2. Check Container Vulnerabilities (Trivy)
run_trivy_scans() {
  echo "2. Initializing Container Vulnerability Scans (Trivy)..."
  local images=(
    "api-gateway"
    "auth-service"
    "crm-service"
    "event-service"
    "gallery-service"
    "frontend"
  )

  for img in "${images[@]}"; do
    local full_img="ghcr.io/lokeshnagrikar/eventos/${img}:${IMAGE_TAG}"
    echo "Scanning image: $full_img..."
    if [ "$DRY_RUN" = "true" ]; then
      echo "[DRY-RUN] trivy image --severity HIGH,CRITICAL --exit-code 1 --ignore-unfixed $full_img"
    else
      if command -v trivy &> /dev/null; then
        trivy image --severity HIGH,CRITICAL --exit-code 1 --ignore-unfixed "$full_img" || {
          echo "CRITICAL: Trivy scan failed. High/Critical vulnerabilities found in $img!"
          exit 1
        }
        echo "SUCCESS: $img passed Trivy check."
      else
        echo "WARNING: Trivy binary not found. Skipping local execution."
        break
      fi
    fi
  done
  echo "----------------------------------------------"
}

# 3. Check Maven Dependencies (Dependency-Check)
run_dependency_check() {
  echo "3. Initializing Dependency Vulnerability Audit..."
  if [ "$DRY_RUN" = "true" ]; then
    echo "[DRY-RUN] cd backend && mvn org.owasp:dependency-check-maven:check"
  else
    if [ -d "backend" ] && command -v mvn &> /dev/null; then
      cd backend
      mvn org.owasp:dependency-check-maven:check || {
        echo "WARNING: Dependency CVEs detected. Check target/dependency-check-report.html"
      }
      cd ..
    else
      echo "WARNING: Maven or backend directory not accessible. Skipping dependency check."
    fi
  fi
  echo "----------------------------------------------"
}

# Run Scans
run_gitleaks_scan
run_trivy_scans
run_dependency_check

echo "=============================================="
echo "SECURITY AUDITING COMPLETED"
echo "=============================================="
