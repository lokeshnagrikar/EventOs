#!/bin/bash

# EventOS Credentials & Secret Rotation Tool
# Generates, injects, and triggers rolling updates of critical credentials.

set -euo pipefail

DRY_RUN=false
SECRET_TYPE=""
NEW_VALUE=""
NAMESPACE="eventos"

# Print Help
usage() {
  echo "Usage: $0 --type <jwt|postgres|rabbitmq> [options]"
  echo "Options:"
  echo "  -t, --type         Secret type to rotate: 'jwt', 'postgres', or 'rabbitmq'"
  echo "  -v, --value        Optional. Explicit secret value. If omitted, a random key is generated."
  echo "  -n, --namespace    Kubernetes namespace. Defaults to 'eventos'."
  echo "  -d, --dry-run      Validate operations without modifying secrets or triggering restarts."
  exit 1
}

# Parse Args
while [[ $# -gt 0 ]]; do
  case $1 in
    -t|--type)
      SECRET_TYPE="$2"
      shift 2
      ;;
    -v|--value)
      NEW_VALUE="$2"
      shift 2
      ;;
    -n|--namespace)
      NAMESPACE="$2"
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

if [[ -z "$SECRET_TYPE" ]]; then
  echo "ERROR: --type parameter is required."
  usage
fi

# 1. Generate or validate value
if [[ -z "$NEW_VALUE" ]]; then
  if [[ "$SECRET_TYPE" == "jwt" ]]; then
    # Generate 256-bit (32 byte) secure random hex string
    NEW_VALUE=$(openssl rand -hex 32)
  else
    # Generate strong 16-character alphanumeric password
    NEW_VALUE=$(openssl rand -base64 12 | tr -d '/+=')
  fi
fi

echo "=============================================="
echo "SECRET ROTATION TOOL INITIALIZED"
echo "Target Secret Type : $SECRET_TYPE"
echo "Dry Run Mode       : $DRY_RUN"
echo "=============================================="

# Helper function to perform updates
update_k8s_secret() {
  local key_name="$1"
  local raw_val="$2"
  local b64_val=$(echo -n "$raw_val" | base64)

  echo "Updating Kubernetes Secret key: $key_name..."
  if [ "$DRY_RUN" = "true" ]; then
    echo "[DRY-RUN] kubectl patch secret eventos-secrets -n $NAMESPACE -p '{\"data\":{\"$key_name\":\"$b64_val\"}}'"
  else
    kubectl patch secret eventos-secrets -n "$NAMESPACE" -p "{\"data\":{\"$key_name\":\"$b64_val\"}}"
  fi
}

update_env_file() {
  local key_name="$1"
  local raw_val="$2"
  
  echo "Updating local .env file key: $key_name..."
  if [ "$DRY_RUN" = "true" ]; then
    echo "[DRY-RUN] sed -i 's/^$key_name=.*/$key_name=$raw_val/' .env"
  else
    if [ -f ".env" ]; then
      # Replaces the line matching key_name=...
      sed -i.bak "s/^$key_name=.*/$key_name=$raw_val/" .env
      echo "SUCCESS: Local .env updated (.env.bak backup created)"
    else
      echo "WARNING: .env file not found in current directory. Skipping local update."
    fi
  fi
}

# 2. Execute Rotation based on Type
case "$SECRET_TYPE" in
  jwt)
    update_k8s_secret "jwt-secret" "$NEW_VALUE"
    update_env_file "JWT_SECRET_KEY" "$NEW_VALUE"
    
    echo "Triggering zero-downtime rolling restart of affected K8s microservices..."
    if [ "$DRY_RUN" = "true" ]; then
      echo "[DRY-RUN] kubectl rollout restart deployment/auth-service deployment/crm-service deployment/event-service deployment/gallery-service deployment/api-gateway -n $NAMESPACE"
    else
      kubectl rollout restart deployment/auth-service deployment/crm-service deployment/event-service deployment/gallery-service deployment/api-gateway -n "$NAMESPACE"
    fi
    ;;
    
  postgres)
    update_k8s_secret "postgres-password" "$NEW_VALUE"
    update_env_file "POSTGRES_PASSWORD" "$NEW_VALUE"
    
    echo "WARNING: Postgres password rotation requires DB connection pool refreshes."
    echo "Triggering database pod rollout and microservice redeployments..."
    if [ "$DRY_RUN" = "true" ]; then
      echo "[DRY-RUN] kubectl rollout restart deployment/postgres -n $NAMESPACE"
      echo "[DRY-RUN] kubectl rollout restart deployment/auth-service deployment/crm-service deployment/event-service deployment/gallery-service -n $NAMESPACE"
    else
      # Restart database first, wait for health, then restart services
      kubectl rollout restart deployment/postgres -n "$NAMESPACE"
      echo "Waiting 15 seconds for DB to accept connections..."
      sleep 15
      kubectl rollout restart deployment/auth-service deployment/crm-service deployment/event-service deployment/gallery-service -n "$NAMESPACE"
    fi
    ;;

  rabbitmq)
    update_k8s_secret "rabbitmq-password" "$NEW_VALUE"
    update_env_file "RABBITMQ_PASS" "$NEW_VALUE"
    
    echo "Triggering rolling restart of RabbitMQ broker and listener microservices..."
    if [ "$DRY_RUN" = "true" ]; then
      echo "[DRY-RUN] kubectl rollout restart deployment/rabbitmq -n $NAMESPACE"
      echo "[DRY-RUN] kubectl rollout restart deployment/crm-service deployment/event-service -n $NAMESPACE"
    else
      kubectl rollout restart deployment/rabbitmq -n "$NAMESPACE"
      echo "Waiting 15 seconds for RabbitMQ broker initialization..."
      sleep 15
      kubectl rollout restart deployment/crm-service deployment/event-service -n "$NAMESPACE"
    fi
    ;;

  *)
    echo "ERROR: Unknown secret type: $SECRET_TYPE"
    usage
    ;;
esac

echo "=============================================="
echo "SECRET ROTATION OPERATIONS COMPLETED SUCCESSFULLY"
echo "=============================================="
