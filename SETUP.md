# Setup and Installation Guide

## System Requirements

### Minimum Requirements
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Docker**: Version 20.0.0 or higher
- **Docker Compose**: Version 2.0.0 or higher
- **RAM**: 4GB minimum (8GB recommended)
- **Disk Space**: 2GB free space

### Supported Operating Systems
- Windows 10/11
- macOS 10.15+
- Ubuntu 20.04+
- Other Linux distributions with Docker support

## Pre-Installation Steps

### 1. Verify Node.js Installation

```bash
# Check Node.js version
node --version

# Check npm version
npm --version
```

If Node.js is not installed:
- **Windows/macOS**: Download from [nodejs.org](https://nodejs.org/)
- **Ubuntu/Debian**: `sudo apt install nodejs npm`
- **CentOS/RHEL**: `sudo dnf install nodejs npm`

### 2. Verify Docker Installation

```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker-compose --version
```

If Docker is not installed:
- **Windows/macOS**: Download Docker Desktop from [docker.com](https://docker.com/)
- **Ubuntu**: Follow [Docker's Ubuntu installation guide](https://docs.docker.com/engine/install/ubuntu/)
- **CentOS**: Follow [Docker's CentOS installation guide](https://docs.docker.com/engine/install/centos/)

## Installation Steps

### Step 1: Clone the Repository

```bash
# Clone the repository (replace with actual URL when available)
git clone <repository-url>
cd wellpro-medplum-demo

# Or download and extract ZIP file if Git is not available
```

### Step 2: Set Up Medplum Backend

```bash
# Start Medplum services with Docker Compose
docker-compose up -d

# Verify services are running
docker-compose ps

# Check logs if there are issues
docker-compose logs
```

**Expected Services:**
- Medplum Server (Port 8103)
- PostgreSQL Database (Internal)
- Redis Cache (Internal)

### Step 3: Wait for Services to Initialize

```bash
# Wait 30-60 seconds for all services to start
# You can monitor the startup process with:
docker-compose logs -f medplum

# Test if Medplum is ready (should return status info)
curl http://localhost:8103/fhir/R4/metadata
```

### Step 4: Configure Environment Variables

Create `.env.local` in the project root:

```bash
# Create environment file
touch .env.local

# Add required configuration
echo "NEXT_PUBLIC_MEDPLUM_BASE_URL=http://localhost:8103" >> .env.local
```

Or manually create the file with this content:
```env
NEXT_PUBLIC_MEDPLUM_BASE_URL=http://localhost:8103
```

### Step 5: Install Dependencies

```bash
# Install all Node.js dependencies
npm install

# Alternative if npm install fails
npm ci
```

### Step 6: Start the Development Server

```bash
# Start Next.js development server
npm run dev

# The application will be available at:
# http://localhost:3000
```

## First-Time Setup

### 1. Access the Application
- Open your web browser
- Navigate to `http://localhost:3000`
- You should see the Wellpro EHR Demo login page

### 2. Create Initial User Account
Follow Medplum's sign-up process to create your first user account.

### 3. Seed Demo Data
- After signing in, look for the "Seed demo data" button in the navigation
- Click it to populate sample patients, practitioners, and appointments
- This creates a realistic environment for testing

## Verification Steps

### 1. Test Patient Management
- Navigate to the "Patients" page
- Verify you can see the seeded patient data
- Check that names, birth dates, and genders display correctly

### 2. Test Appointment Scheduling
- Navigate to the "Appointments" page
- Try creating a new appointment
- Verify dropdowns are populated with patients and practitioners
- Confirm the appointment appears in the list

### 3. Test Authentication Flow
- Click "Sign out" to test logout functionality
- Verify you're redirected to the sign-in page
- Sign back in to confirm the flow works properly

## Troubleshooting

### Common Issues

#### Medplum Connection Problems

**Symptom**: "Failed to load data" errors
```bash
# Check if Medplum is running
docker ps | grep medplum

# Restart Medplum services
docker-compose down
docker-compose up -d

# Check Medplum logs
docker-compose logs medplum
```

#### Port Conflicts

**Symptom**: "Port already in use" errors
```bash
# Check what's using port 8103
lsof -i :8103  # macOS/Linux
netstat -ano | findstr :8103  # Windows

# Stop conflicting services or change ports in docker-compose.yml
```

#### Database Connection Issues

**Symptom**: Medplum starts but database errors in logs
```bash
# Restart with fresh database
docker-compose down -v
docker-compose up -d
```

#### Node.js Version Issues

**Symptom**: Build or runtime errors
```bash
# Check Node.js version
node --version

# If version is too old, update Node.js
# Consider using nvm for version management
```

### Performance Issues

#### Slow Docker Startup
- Increase Docker Desktop memory allocation (4GB minimum)
- Close other resource-intensive applications
- Consider using Docker on Linux for better performance

#### Slow Next.js Development Server
```bash
# Clear Next.js cache
rm -rf .next

# Restart development server
npm run dev
```

### Development Tools

#### Useful Commands

```bash
# View all logs
docker-compose logs

# Follow specific service logs
docker-compose logs -f medplum

# Check service status
docker-compose ps

# Restart specific service
docker-compose restart medplum

# Clean restart (removes data)
docker-compose down -v && docker-compose up -d
```

#### Database Access (Advanced)

```bash
# Access PostgreSQL directly (for debugging)
docker-compose exec postgres psql -U medplum medplum

# View FHIR resources
docker-compose exec postgres psql -U medplum medplum -c "SELECT * FROM \"Resource\" LIMIT 10;"
```

## Environment Configuration

### Development vs Production

This setup guide is for **development only**. For production:

1. **Never use** default passwords or configurations
2. **Implement** proper SSL/TLS encryption
3. **Configure** proper database security
4. **Set up** monitoring and logging
5. **Follow** HIPAA compliance requirements (see HIPAA-DISCLAIMER.md)

### Advanced Configuration

#### Custom Medplum Configuration

Edit `docker-compose.yml` to customize:
- Database settings
- Port mappings
- Environment variables
- Volume mounts

#### Next.js Configuration

Edit `next.config.ts` for:
- Build optimization
- API configuration
- Deployment settings

## Support

### Getting Help

1. **Check logs**: Always check Docker and application logs first
2. **Verify setup**: Ensure all prerequisites are met
3. **Check documentation**: Review README.md and this setup guide
4. **Search issues**: Look for similar problems in project issues

### Reporting Issues

When reporting problems, include:
- Operating system and version
- Node.js and npm versions
- Docker and Docker Compose versions
- Complete error messages and stack traces
- Steps to reproduce the issue

---

**Need help? Make sure you've followed all steps in this guide before reaching out for support.**