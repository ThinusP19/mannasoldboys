# Production Launch Checklist

Use this checklist to verify everything is properly configured before launching to production.

---

## Backend Configuration

### Environment Variables

- [ ] `NODE_ENV` set to `production`
- [ ] `DB_HOST` points to production database
- [ ] `DB_PORT` correct (usually 1433 for SQL Server)
- [ ] `DB_NAME` is production database name
- [ ] `DB_USER` is production database user (not `sa` or admin)
- [ ] `DB_PASS` is strong password (20+ characters)
- [ ] `JWT_SECRET` generated and at least 64 characters
  ```bash
  openssl rand -base64 64
  ```
- [ ] `JWT_EXPIRES_IN` set appropriately (e.g., `7d`)
- [ ] `CORS_ORIGIN` contains only production domains
- [ ] No localhost URLs in any environment variable

### Database

- [ ] Production database created
- [ ] Database user has minimal required permissions
- [ ] Database connection tested from application server
- [ ] Initial data/migrations completed
- [ ] Database backup system configured
- [ ] Backup restoration tested

### Security

- [ ] SSL/TLS certificate installed
- [ ] HTTPS enforced (redirect HTTP → HTTPS)
- [ ] Firewall configured (only necessary ports open)
- [ ] Rate limiting enabled
- [ ] Security headers configured in Nginx/server
- [ ] `.env` files not committed to repository
- [ ] Sensitive files have proper permissions (chmod 600)

---

## Web Frontend

### Build & Deployment

- [ ] `VITE_API_URL` points to production API
- [ ] Production build completed (`npm run build`)
- [ ] Build folder deployed to web server
- [ ] Static assets caching configured
- [ ] Gzip compression enabled
- [ ] SPA routing configured (all routes → index.html)

### Functionality

- [ ] Login works with production API
- [ ] Registration works
- [ ] Profile update works
- [ ] Image upload works
- [ ] All pages load without errors
- [ ] Console shows no JavaScript errors
- [ ] Responsive design works on mobile browsers

---

## Mobile App

### Configuration

- [ ] `apiUrl` in `app.json` → production API
  ```json
  "extra": {
    "apiUrl": "https://api.alumni.potchgim.co.za/api"
  }
  ```
- [ ] EAS project ID configured
- [ ] App version incremented
- [ ] Build number/version code incremented

### iOS Specific

- [ ] Bundle identifier correct (`com.potchgim.alumniconnect`)
- [ ] Apple Developer account active
- [ ] App Store Connect listing complete
- [ ] Privacy policy URL live and accessible
- [ ] All required screenshots uploaded
- [ ] App icon uploaded (1024x1024)
- [ ] TestFlight testing completed

### Android Specific

- [ ] Package name correct (`com.potchgim.alumniconnect`)
- [ ] Google Play Console setup complete
- [ ] Service account for EAS Submit configured
- [ ] Privacy policy URL set in Play Console
- [ ] Data safety form completed
- [ ] Content rating questionnaire completed
- [ ] Feature graphic uploaded (1024x500)
- [ ] All required screenshots uploaded
- [ ] Internal testing completed

### Both Platforms

- [ ] Push notification certificates/keys configured
- [ ] Deep linking tested
- [ ] Offline behavior acceptable
- [ ] App doesn't crash on startup
- [ ] All core features functional:
  - [ ] Login
  - [ ] Registration
  - [ ] View profile
  - [ ] Edit profile
  - [ ] Profile photo upload
  - [ ] Alumni directory
  - [ ] Search
  - [ ] View events
  - [ ] Logout

---

## Legal & Compliance

### Privacy Policy

- [ ] Privacy policy document created
- [ ] Hosted at accessible public URL
- [ ] URL works globally (no geo-restrictions)
- [ ] Covers all data collection:
  - [ ] Name
  - [ ] Email
  - [ ] Profile photos
  - [ ] Graduation year
  - [ ] Location (optional)
- [ ] Explains data usage
- [ ] Describes data sharing (or states no sharing)
- [ ] Includes contact information
- [ ] Includes date of last update

### Terms of Service

- [ ] Terms document created
- [ ] Hosted at accessible public URL
- [ ] Covers acceptable use
- [ ] Covers account termination
- [ ] Covers liability limitations

---

## Monitoring & Logging

### Server Monitoring

- [ ] Application logs being captured
- [ ] Error tracking service configured (optional)
- [ ] Server health checks configured
- [ ] Uptime monitoring active
- [ ] Alert notifications configured

### Analytics (Optional)

- [ ] Web analytics configured
- [ ] Mobile analytics configured
- [ ] Privacy-compliant tracking only

---

## DNS & SSL

### Domain Configuration

- [ ] Domain purchased and configured
- [ ] DNS A records pointing to server
- [ ] Subdomains configured:
  - [ ] `alumni.potchgim.co.za` → web frontend
  - [ ] `api.alumni.potchgim.co.za` → backend API
- [ ] DNS propagation complete

### SSL Certificates

- [ ] SSL certificate installed for web frontend
- [ ] SSL certificate installed for API
- [ ] Certificate auto-renewal configured
- [ ] SSL Labs test grade A or higher
- [ ] HSTS enabled (optional but recommended)

---

## Backup & Recovery

### Backups

- [ ] Database backup schedule configured
- [ ] Backup location secure and separate from main server
- [ ] Backup encryption enabled (if sensitive)
- [ ] Backup retention policy defined (e.g., 30 days)

### Recovery Testing

- [ ] Database restoration tested
- [ ] Application redeployment process documented
- [ ] Recovery time objective (RTO) defined
- [ ] Recovery point objective (RPO) defined

---

## Documentation

### Handover Documents

- [ ] README.md updated
- [ ] HANDOVER.md current
- [ ] Deployment guide complete
- [ ] Environment variables documented
- [ ] All credentials stored securely (not in docs)

### Operational Runbooks

- [ ] How to deploy updates
- [ ] How to rollback
- [ ] How to restart services
- [ ] How to check logs
- [ ] Emergency contacts listed

---

## Final Verification

### Smoke Tests

Run these tests on production after deployment:

```
1. Open web app in browser
   [ ] Page loads
   [ ] No console errors

2. Create new account
   [ ] Registration form works
   [ ] Email validation works
   [ ] Account created successfully

3. Login
   [ ] Login works
   [ ] Redirects to dashboard

4. Edit profile
   [ ] Can update name
   [ ] Can upload photo
   [ ] Changes persist

5. Browse alumni
   [ ] Directory loads
   [ ] Search works
   [ ] Can view profiles

6. Mobile app
   [ ] App opens without crash
   [ ] Can login
   [ ] Same functionality as web

7. API health
   [ ] GET /api/health returns 200
```

### Performance

- [ ] Page load time acceptable (< 3 seconds)
- [ ] API response time acceptable (< 500ms)
- [ ] No memory leaks under load
- [ ] Database queries optimized

---

## Launch Day

### Pre-Launch (1 day before)

- [ ] Final testing complete
- [ ] Team notified of launch time
- [ ] Monitoring dashboards open
- [ ] Rollback plan ready

### Launch

- [ ] DNS switched/updated
- [ ] Mobile apps submitted for review
- [ ] Monitor for errors
- [ ] Test all critical paths

### Post-Launch (1 hour after)

- [ ] Check error logs
- [ ] Verify user registrations working
- [ ] Monitor server resources
- [ ] Check mobile app store status

### Post-Launch (24 hours after)

- [ ] Review any error reports
- [ ] Check analytics for issues
- [ ] Respond to any user feedback
- [ ] Celebrate! 🎉

---

## Emergency Contacts

| Role | Contact |
|------|---------|
| Technical Lead | [Add contact] |
| Server Admin | [Add contact] |
| Database Admin | [Add contact] |
| Apple Developer Account | [Add contact] |
| Google Play Account | [Add contact] |

---

## Quick Commands Reference

```bash
# Check Docker status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart services
docker compose -f docker-compose.prod.yml restart

# Check SSL certificate
openssl s_client -connect api.alumni.potchgim.co.za:443 -servername api.alumni.potchgim.co.za

# Test API health
curl https://api.alumni.potchgim.co.za/api/health

# Check disk space
df -h

# Check memory
free -m
```

---

*This checklist should be completed before announcing the launch to users.*
