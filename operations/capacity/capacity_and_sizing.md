# EventOS Capacity Sizing & Cost Estimation Framework

This document outlines the performance benchmarks, resource sizing recommendations, and monthly cost estimation formulas for the EventOS platform across key user scaling tiers.

---

## 1. Scale Targets & Benchmarks

Our sizing recommendations are based on typical user behavior distributions:
- **Write-Intensive Activity (15%)**: Quote generation, payment capture, and settings updates.
- **Read-Intensive Activity (60%)**: Viewing invoices, dashboard metrics, and shared media albums.
- **Static Content delivery (25%)**: Public landings and Next.js assets.

### Scaling Tiers:

| Load Metric | Small Tier (100 Users) | Medium Tier (500 Users) | Enterprise Tier (1,000 Users) |
| :--- | :--- | :--- | :--- |
| **Concurrent Active Sessions** | 100 | 500 | 1,000 |
| **API Throughput Target** | ~50 req/sec | ~250 req/sec | ~500 req/sec |
| **Database Transaction Rate** | ~15 TPS | ~75 TPS | ~150 TPS |
| **Peak Media Upload Rate** | 2 uploads/sec | 10 uploads/sec | 20 uploads/sec |

---

## 2. Infrastructure Sizing Recommendations

### Tier 1: Small Scale (100 Concurrent Users)
- **Kubernetes Node Pool**: 2x General Purpose Nodes (e.g. AWS `t3.medium` - 2 vCPU, 4GB RAM).
- **Postgres Database**: Single instance (e.g. AWS RDS `db.t3.medium` - 2 vCPU, 4GB RAM, 20GB gp3 storage).
- **RabbitMQ & Redis**: Shared container workloads inside node pool.
- **Replica Configuration**:
  - Microservices (`auth`, `crm`, `event`, `gallery`, `gateway`): 1 replica each.
  - Next.js Web Frontend: 1 replica.

### Tier 2: Medium Scale (500 Concurrent Users)
- **Kubernetes Node Pool**: 3x General Purpose Nodes (e.g. AWS `m5.large` - 2 vCPU, 8GB RAM).
- **Postgres Database**: High Availability Multi-AZ (e.g. AWS RDS `db.m5.large` - 2 vCPU, 8GB RAM, 50GB gp3 storage).
- **RabbitMQ & Redis**: Dedicated deployments inside K8s cluster (Redis caching enabled).
- **Replica Configuration**:
  - Microservices: 2 replicas each (with horizontal pod autoscaling).
  - Next.js Web Frontend: 2 replicas.

### Tier 3: Enterprise Scale (1,000 Concurrent Users)
- **Kubernetes Node Pool**: 4x General Purpose Nodes (e.g. AWS `m5.xlarge` - 4 vCPU, 16GB RAM).
- **Postgres Database**: Provisioned IOPS Multi-AZ with Read Replica (e.g. AWS RDS `db.m5.xlarge` - 4 vCPU, 16GB RAM, 100GB gp3 storage with 3000 PIOPS).
- **RabbitMQ & Redis**: Dedicated cluster nodes.
- **Replica Configuration**:
  - Microservices: 3-4 replicas (autoscaling based on CPU >75%).
  - Next.js Web Frontend: 3 replicas.

---

## 3. Pod Resource Allocation Values

For Helm and deployment charts, we enforce these container boundaries:

| Deployment | CPU Request | CPU Limit | Memory Request | Memory Limit |
| :--- | :--- | :--- | :--- | :--- |
| **api-gateway** | `100m` | `250m` | `128Mi` | `256Mi` |
| **auth-service** | `200m` | `500m` | `256Mi` | `512Mi` |
| **crm-service** | `200m` | `500m` | `256Mi` | `512Mi` |
| **event-service** | `250m` | `500m` | `256Mi` | `512Mi` |
| **gallery-service**| `200m` | `500m` | `256Mi` | `512Mi` |
| **web-frontend** | `150m` | `300m` | `256Mi` | `512Mi` |

---

## 4. Cost Estimation Framework

Monthly infrastructure costs can be projected using this pricing formula:

$$\text{Monthly Cost} = C_{\text{compute}} + C_{\text{database}} + C_{\text{cache}} + C_{\text{storage}} + C_{\text{network}}$$

Where:
- $C_{\text{compute}}$: (Nodes count) $\times$ (Node Instance Hourly Rate) $\times 730$
- $C_{\text{database}}$: (RDS Instance Hourly Rate + IOPS cost + Storage per GB) $\times 730$
- $C_{\text{cache}}$: (Elasticache Redis Instance Hourly Rate) $\times 730$
- $C_{\text{storage}}$: (Cloudinary Storage/Credits Plan) + (S3 storage GB price $\times$ Backups size)
- $C_{\text{network}}$: (Data Transfer Out GB volume $\times \$0.09$)

### Estimated Monthly Projections (AWS Base Pricing):
- **100 User Tier**: **~$250 / Month**
- **500 User Tier**: **~$750 / Month**
- **1,000 User Tier**: **~$1,500 / Month**
