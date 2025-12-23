# Docker Deployment Guide

This guide explains how to deploy the Wellpro Medplum Demo using Docker.

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ymykhal/wellpro-medplum-demo.git
   cd wellpro-medplum-demo
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your preferred settings
   ```

3. **Run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - Open http://localhost:3000 in your browser
   - The app will connect to Medplum's demo server by default

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_MEDPLUM_BASE_URL` | `https://api.medplum.com/` | Medplum server URL |
| `PORT` | `3000` | Application port |
| `NODE_ENV` | `production` | Node.js environment |

### Using Your Own Medplum Server

1. Update `.env`:
   ```env
   NEXT_PUBLIC_MEDPLUM_BASE_URL=https://your-medplum-server.com/
   ```

2. Rebuild and restart:
   ```bash
   docker-compose up --build -d
   ```

## Production Deployment

### With Traefik (Recommended)

1. **Copy the override example:**
   ```bash
   cp docker-compose.override.yml.example docker-compose.override.yml
   ```

2. **Edit the override file:**
   ```yaml
   # docker-compose.override.yml
   services:
     wellpro-medplum-demo:
       labels:
         - traefik.http.routers.Wellpro-demo.rule=Host(`your-domain.com`)
         # ... other Traefik labels
   ```

3. **Deploy:**
   ```bash
   docker-compose up -d
   ```

### Standalone Production

For production without Traefik, expose the port directly:

```yaml
# docker-compose.override.yml
services:
  wellpro-medplum-demo:
    ports:
      - "80:3000"  # or "443:3000" with SSL termination
```

## Development

### Building Locally

```bash
# Build the image
docker build -t wellpro-medplum-demo .

# Run with custom port
docker run -p 8080:3000 \
  -e NEXT_PUBLIC_MEDPLUM_BASE_URL=https://api.medplum.com/ \
  wellpro-medplum-demo
```

### Development Mode

For development, use the local dev server instead:

```bash
npm install
npm run dev
```

## Troubleshooting

### Health Check Failing

If the health check fails, check:

1. **Container logs:**
   ```bash
   docker-compose logs wellpro-medplum-demo
   ```

2. **Network connectivity:**
   ```bash
   docker-compose exec wellpro-medplum-demo curl -f http://localhost:3000/
   ```

3. **Medplum server connectivity:**
   ```bash
   docker-compose exec wellpro-medplum-demo curl -f $NEXT_PUBLIC_MEDPLUM_BASE_URL
   ```

### Memory Issues

For large deployments, increase memory:

```yaml
# docker-compose.override.yml
services:
  wellpro-medplum-demo:
    environment:
      - NODE_OPTIONS=--max-old-space-size=1024
```

### SSL/TLS Issues

For HTTPS deployments, ensure:

1. Traefik is properly configured with SSL certificates
2. Medplum server URL uses HTTPS
3. Mixed content warnings are resolved

## Security Considerations

1. **Use HTTPS in production**
2. **Keep Docker images updated**
3. **Configure proper firewall rules**
4. **Use secrets management for sensitive data**
5. **Enable security headers via reverse proxy**

## Monitoring

### Container Health

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f wellpro-medplum-demo

# Monitor resource usage
docker stats wellpro-medplum-demo
```

### Application Metrics

The application includes a health endpoint at `/api/health` for monitoring.

## Scaling

For high-traffic deployments:

1. **Use multiple replicas:**
   ```yaml
   services:
     wellpro-medplum-demo:
       deploy:
         replicas: 3
   ```

2. **Load balancing with Traefik**
3. **Database connection pooling**
4. **CDN for static assets**