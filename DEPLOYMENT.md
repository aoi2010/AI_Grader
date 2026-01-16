# 🚀 DEPLOYMENT CHECKLIST

## Pre-Deployment Steps

### ✅ Local Testing
- [ ] All dependencies installed (`pip install -r requirements.txt`)
- [ ] .env file configured with valid Gemini API key
- [ ] Application starts without errors (`python -m backend.main`)
- [ ] Can access http://localhost:8000
- [ ] Can create exam successfully
- [ ] Questions generate correctly
- [ ] Can answer and save responses
- [ ] PDF upload works
- [ ] Timer functions properly
- [ ] Evaluation completes successfully
- [ ] No console errors in browser (F12)

### ✅ Code Review
- [ ] All sensitive data in .env (not hardcoded)
- [ ] No TODO comments for critical features
- [ ] Error handling comprehensive
- [ ] All imports working
- [ ] No syntax errors

### ✅ Documentation
- [ ] README.md reviewed
- [ ] QUICKSTART.md tested
- [ ] API_DOCUMENTATION.md accurate
- [ ] .env.example up to date

---

## Production Configuration

### ✅ Environment Variables (.env)
```bash
# REQUIRED
GEMINI_API_KEY=your_production_gemini_key

# Database (PostgreSQL recommended for production)
DATABASE_URL=postgresql://user:pass@host:5432/ai_grader

# Security
SECRET_KEY=generate_strong_random_key_here

# Upload Settings
UPLOAD_DIR=/var/www/ai_grader/uploads
MAX_FILE_SIZE=10485760
```

### ✅ Security Hardening
- [ ] Change SECRET_KEY to strong random value
- [ ] Use PostgreSQL instead of SQLite
- [ ] Configure CORS origins (remove `allow_origins=["*"]`)
- [ ] Set up HTTPS/SSL
- [ ] Implement rate limiting
- [ ] Add authentication if needed
- [ ] Secure file upload directory
- [ ] Set proper file permissions

### ✅ Performance Optimization
- [ ] Set `echo=False` in database.py
- [ ] Configure connection pooling
- [ ] Set up caching if needed
- [ ] Optimize Gemini API calls
- [ ] Enable gzip compression
- [ ] Configure static file caching

---

## Deployment Options

### Option 1: Traditional VPS (Linux Server)

**Requirements:**
- Ubuntu 20.04+ / Debian 11+
- Python 3.11+
- PostgreSQL 14+
- Nginx
- 2GB RAM minimum

**Steps:**

1. **Setup Server**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.11
sudo apt install python3.11 python3.11-venv python3-pip -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y
```

2. **Setup Database**
```bash
# Create database
sudo -u postgres psql
CREATE DATABASE ai_grader;
CREATE USER aigrader_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ai_grader TO aigrader_user;
\q
```

3. **Deploy Application**
```bash
# Create application directory
sudo mkdir -p /var/www/ai_grader
cd /var/www/ai_grader

# Upload your code (via git, scp, etc.)
git clone your_repo_url .

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn  # Production server

# Configure environment
cp .env.example .env
nano .env  # Edit with production values
```

4. **Configure Systemd Service**
```bash
# Create service file
sudo nano /etc/systemd/system/aigrader.service
```

**Service file content:**
```ini
[Unit]
Description=AI Grader Application
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/ai_grader
Environment="PATH=/var/www/ai_grader/venv/bin"
ExecStart=/var/www/ai_grader/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.main:app --bind 0.0.0.0:8000

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable aigrader
sudo systemctl start aigrader
sudo systemctl status aigrader
```

5. **Configure Nginx**
```bash
sudo nano /etc/nginx/sites-available/aigrader
```

**Nginx config:**
```nginx
server {
    listen 80;
    server_name your_domain.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads {
        alias /var/www/ai_grader/uploads;
        internal;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/aigrader /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

6. **Setup SSL (Let's Encrypt)**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your_domain.com
```

---

### Option 2: Docker Deployment

**Create Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "-m", "backend.main"]
```

**Create docker-compose.yml:**
```yaml
version: '3.8'

services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: ai_grader
      POSTGRES_USER: aigrader
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://aigrader:your_password@db:5432/ai_grader
      GEMINI_API_KEY: ${GEMINI_API_KEY}
    depends_on:
      - db
    volumes:
      - ./uploads:/app/uploads

volumes:
  postgres_data:
```

**Deploy:**
```bash
docker-compose up -d
```

---

### Option 3: Cloud Platforms

#### **Heroku**
```bash
# Install Heroku CLI
# Create Procfile
echo "web: python -m backend.main" > Procfile

# Create runtime.txt
echo "python-3.11.0" > runtime.txt

# Deploy
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set GEMINI_API_KEY=your_key
git push heroku main
```

#### **AWS Elastic Beanstalk**
```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p python-3.11 ai-grader

# Create environment
eb create ai-grader-env

# Set environment variables
eb setenv GEMINI_API_KEY=your_key

# Deploy
eb deploy
```

#### **Google Cloud Run**
```bash
# Build and deploy
gcloud run deploy ai-grader \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_key
```

---

## Post-Deployment

### ✅ Verification
- [ ] Application accessible via public URL
- [ ] HTTPS working (SSL certificate valid)
- [ ] Database connected
- [ ] File uploads working
- [ ] Gemini API responding
- [ ] Timer persisting correctly
- [ ] Create test exam and complete full flow

### ✅ Monitoring
- [ ] Setup logging (application logs)
- [ ] Setup error tracking (e.g., Sentry)
- [ ] Monitor server resources (CPU, RAM, disk)
- [ ] Monitor database size
- [ ] Setup uptime monitoring
- [ ] Configure alerts

### ✅ Backup Strategy
- [ ] Database backups configured (daily)
- [ ] Upload directory backups
- [ ] Backup retention policy (30 days)
- [ ] Test restore procedure

### ✅ Maintenance
- [ ] Document update procedure
- [ ] Schedule security updates
- [ ] Plan for scaling if needed
- [ ] Monitor API usage (Gemini quota)

---

## Performance Tuning

### Database
```python
# In database.py
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True,
    pool_recycle=3600
)
```

### Gunicorn Configuration
```bash
# For 4GB RAM server
gunicorn -w 4 -k uvicorn.workers.UvicornWorker \
  --timeout 300 \
  --max-requests 1000 \
  --max-requests-jitter 100 \
  backend.main:app
```

---

## Scaling Considerations

### Vertical Scaling
- Increase server RAM (4GB → 8GB)
- Add more CPU cores
- Faster disk (SSD)

### Horizontal Scaling
- Load balancer + multiple app servers
- Separate database server
- CDN for static files
- Redis for caching

### Database Optimization
- Add indexes on frequently queried columns
- Connection pooling
- Read replicas for reports

---

## Cost Estimation

### Minimal Setup (VPS)
- VPS: $10-20/month (2GB RAM)
- Domain: $10/year
- SSL: Free (Let's Encrypt)
- Gemini API: Free tier (60 requests/minute)
- **Total: ~$15/month**

### Production Setup
- VPS: $40-80/month (8GB RAM)
- Database: $25/month (managed PostgreSQL)
- CDN: $5-10/month
- Monitoring: $10-20/month
- Gemini API: Pay-as-you-go
- **Total: ~$100-150/month**

---

## Troubleshooting

### Issue: Application won't start
```bash
# Check logs
sudo journalctl -u aigrader -f

# Check Python path
which python3.11

# Check permissions
ls -la /var/www/ai_grader
```

### Issue: Database connection fails
```bash
# Test PostgreSQL connection
psql -h localhost -U aigrader_user -d ai_grader

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### Issue: Gemini API not working
```bash
# Test API key
curl -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY"
```

### Issue: File upload fails
```bash
# Check upload directory
ls -la /var/www/ai_grader/uploads

# Fix permissions
sudo chown -R www-data:www-data /var/www/ai_grader/uploads
sudo chmod -R 755 /var/www/ai_grader/uploads
```

---

## Security Checklist

- [ ] Firewall configured (allow 80, 443, 22 only)
- [ ] SSH key-only authentication
- [ ] Regular security updates
- [ ] Strong database passwords
- [ ] API keys in environment variables (not code)
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] File upload validation strict
- [ ] Rate limiting enabled
- [ ] SQL injection protection (using ORM)
- [ ] XSS protection (sanitize inputs)

---

## Support & Maintenance

### Regular Tasks
- **Daily:** Check error logs
- **Weekly:** Review resource usage
- **Monthly:** Security updates, database backup verification
- **Quarterly:** Performance review, cost analysis

### Emergency Contacts
- Hosting provider support
- Database administrator
- Development team

---

## Success Metrics

After deployment, track:
- [ ] Uptime percentage (target: 99.9%)
- [ ] Average response time (target: <500ms)
- [ ] Successful exam completions
- [ ] User feedback/ratings
- [ ] Error rate (target: <0.1%)

---

## 🎉 DEPLOYMENT COMPLETE!

Once all checkboxes are ticked, your AI Grader is:
✅ Live and accessible
✅ Secure
✅ Monitored
✅ Backed up
✅ Ready for users!

**Congratulations! 🚀**
