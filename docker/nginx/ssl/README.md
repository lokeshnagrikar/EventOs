# Nginx SSL Certificates Directory

For security reasons, private keys (`*.key`) are excluded from version control and MUST NOT be committed to the repository.

## Required Files for TLS Termination

1. `eventos.crt`: Public TLS certificate (self-signed for local development or CA-issued for staging/production).
2. `eventos.key`: TLS private key (must be injected at deployment time or generated locally for development).

## Local Development Setup

To generate a local development key:
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/nginx/ssl/eventos.key \
  -out docker/nginx/ssl/eventos.crt \
  -subj "/CN=localhost"
```

## Production Deployment

Inject the private key via Kubernetes Secret, Docker secret mount, or host-mounted volume configured via `NGINX_SSL_DIR` environment variable.
