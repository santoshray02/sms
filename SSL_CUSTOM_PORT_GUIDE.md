# SSL on Custom Ports - Complete Guide

This guide explains how to deploy ERPNext Education with SSL (HTTPS) on custom ports.

## Quick Start

Deploy with SSL on custom ports (e.g., 8080 for HTTP, 8443 for HTTPS):

```bash
python3 ./easy-install.py deploy \
    --project=school_main \
    --email=yourrealemail@yourdomain.com \
    --image=ghcr.io/frappe/education \
    --version=latest \
    --app=education \
    --sitename=school.yourdomain.com \
    --http-port=8080 \
    --https-port=8443
```

## How It Works

The system uses Traefik as a reverse proxy with Let's Encrypt for automatic SSL certificates:

- **HTTP Port** (--http-port): The public port for HTTP traffic (default: 80)
- **HTTPS Port** (--https-port): The public port for HTTPS traffic (default: 443)
- HTTP traffic is automatically redirected to HTTPS
- SSL certificates are obtained automatically from Let's Encrypt

## Important Requirements for SSL

### Domain Requirements
✅ **REQUIRED for SSL to work:**
1. A real domain name (e.g., `school.example.com`)
2. Domain must point to your server's public IP address
3. Ports must be accessible from the internet (for Let's Encrypt validation)

❌ **Will NOT work with:**
- `localhost`
- `*.localhost` domains
- Internal IP addresses (192.168.x.x, 10.x.x.x)
- Domains not pointing to your server

### Port Access Requirements

Let's Encrypt needs to validate your domain ownership. This requires:
- The HTTP port must be accessible from the internet
- During initial setup, Let's Encrypt will access `http://yourdomain.com/.well-known/acme-challenge/`

## Deployment Scenarios

### Scenario 1: Standard Ports with SSL (Production)
**Best for:** Production deployments with a real domain

```bash
python3 ./easy-install.py deploy \
    --project=school_prod \
    --email=admin@yourschool.com \
    --image=ghcr.io/frappe/education \
    --version=latest \
    --app=education \
    --sitename=school.yourschool.com
```

- HTTP: Port 80
- HTTPS: Port 443
- SSL: Automatic via Let's Encrypt
- Access: https://school.yourschool.com

### Scenario 2: Custom Ports with SSL (Behind Firewall)
**Best for:** Internal deployment behind a firewall/router with port forwarding

```bash
python3 ./easy-install.py deploy \
    --project=school_main \
    --email=admin@yourschool.com \
    --image=ghcr.io/frappe/education \
    --version=latest \
    --app=education \
    --sitename=school.yourschool.com \
    --http-port=8080 \
    --https-port=8443
```

Then configure your router/firewall to forward:
- External port 80 → Internal port 8080
- External port 443 → Internal port 8443

- HTTP: Port 8080 (internal)
- HTTPS: Port 8443 (internal)
- SSL: Automatic via Let's Encrypt
- Access: https://school.yourschool.com (external) or https://internal-ip:8443 (internal)

### Scenario 3: No SSL with Custom Port (Testing/Local)
**Best for:** Local development or testing

```bash
python3 ./easy-install.py deploy \
    --project=school_test \
    --email=test@example.com \
    --image=ghcr.io/frappe/education \
    --version=latest \
    --app=education \
    --sitename=school.localhost \
    --no-ssl \
    --http-port=8080
```

- HTTP: Port 8080
- HTTPS: None
- SSL: Disabled
- Access: http://localhost:8080

## Troubleshooting SSL Issues

### Issue 1: SSL Certificate Not Obtained

**Symptoms:**
- Site loads but shows "Connection not secure"
- Traefik logs show ACME challenge failures

**Solutions:**
1. Verify domain points to your server:
   ```bash
   dig school.yourdomain.com
   nslookup school.yourdomain.com
   ```

2. Check if HTTP port is accessible from internet:
   ```bash
   # From another computer/phone (not your server)
   curl http://school.yourdomain.com/.well-known/acme-challenge/test
   ```

3. Check Traefik logs:
   ```bash
   ./manage.sh logs school_main | grep -i acme
   ```

4. Common fixes:
   - Ensure firewall allows HTTP/HTTPS ports
   - Check router port forwarding is correctly configured
   - Verify DNS propagation (can take up to 48 hours)

### Issue 2: "Email example.com not acceptable"

**Solution:** Use a real email address, not one with `example.com`

### Issue 3: Port Already in Use

**Symptoms:**
```
Error: port is already allocated
```

**Solutions:**
1. Choose a different port:
   ```bash
   --http-port=8090 --https-port=8493
   ```

2. Or stop the conflicting service:
   ```bash
   # Find what's using the port
   sudo lsof -i :8080
   sudo lsof -i :8443
   ```

### Issue 4: Can't Access from Outside Network

**Solutions:**
1. Configure port forwarding on your router
2. Check firewall rules:
   ```bash
   sudo ufw allow 8080/tcp
   sudo ufw allow 8443/tcp
   ```

3. If on cloud provider (AWS/GCP/Azure), check security groups

## Advanced: Multiple Schools with Different Ports

You can run multiple schools, each on different ports:

```bash
# School 1
python3 ./easy-install.py deploy \
    --project=school_abc \
    --sitename=abc.schools.com \
    --email=admin@abc.com \
    --app=education \
    --http-port=8080 \
    --https-port=8443

# School 2
python3 ./easy-install.py deploy \
    --project=school_xyz \
    --sitename=xyz.schools.com \
    --email=admin@xyz.com \
    --app=education \
    --http-port=9080 \
    --https-port=9443
```

Each school gets:
- Its own SSL certificate
- Its own ports
- Its own database
- Its own containers

## Checking Your Configuration

View your current ports:

```bash
# Check environment file
cat ~/santosh-school_main.env | grep PORT

# Check running containers
docker compose -p santosh-school_main ps

# Check which ports are being used
sudo netstat -tlnp | grep docker
```

## Port Configuration Summary

| Scenario | --no-ssl | --http-port | --https-port | Result |
|----------|----------|-------------|--------------|--------|
| Standard SSL | No | Not specified | Not specified | HTTP:80, HTTPS:443 with SSL |
| Custom ports SSL | No | 8080 | 8443 | HTTP:8080, HTTPS:8443 with SSL |
| No SSL custom | Yes | 8080 | Ignored | HTTP:8080, no HTTPS |
| Standard no SSL | Yes | 8080 | Ignored | HTTP:8080, no HTTPS |

## SSL Certificate Renewal

Let's Encrypt certificates:
- Valid for 90 days
- Automatically renewed by Traefik
- No manual intervention needed

Check certificate expiration:
```bash
echo | openssl s_client -servername school.yourdomain.com -connect school.yourdomain.com:8443 2>/dev/null | openssl x509 -noout -dates
```

## Security Best Practices

1. **Use strong admin passwords** - Change from default immediately
2. **Keep ports closed** - Only open what you need
3. **Use firewall** - Configure ufw or iptables
4. **Regular updates** - Keep system and containers updated
5. **Backup certificates** - Certificate data is in Docker volume `cert-data`

## Backup SSL Certificates

Your SSL certificates are stored in a Docker volume. To backup:

```bash
docker run --rm -v santosh-school_main_cert-data:/data -v $(pwd):/backup ubuntu tar czf /backup/ssl-cert-backup.tar.gz -C /data .
```

To restore:

```bash
docker run --rm -v santosh-school_main_cert-data:/data -v $(pwd):/backup ubuntu bash -c "cd /data && tar xzf /backup/ssl-cert-backup.tar.gz"
```

## Quick Reference Commands

```bash
# Deploy with SSL on custom ports
python3 ./easy-install.py deploy --project=school --email=admin@school.com --sitename=school.domain.com --http-port=8080 --https-port=8443 --app=education

# Deploy without SSL
python3 ./easy-install.py deploy --project=school --no-ssl --http-port=8080 --sitename=school.localhost --app=education

# Check logs
./manage.sh logs school

# Check status
./manage.sh status school

# Access shell
./manage.sh shell school
```

## Need Help?

- Check logs: `./manage.sh logs school_main`
- View containers: `docker compose -p santosh-school_main ps`
- Traefik dashboard: Access http://your-ip:8080/dashboard/ (if enabled)
- Frappe Forum: https://discuss.erpnext.com
