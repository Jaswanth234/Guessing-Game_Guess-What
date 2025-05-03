# AWS Deployment Checklist

Use this checklist to track your progress while deploying the Quiz Application to AWS.

## Local Preparation

- [ ] Update application for production
  - [x] Create .env.production file
  - [x] Create config.prod.ts for server settings
  - [x] Create deployment scripts and configuration files
  - [ ] Test build process locally: `npm run build`
  - [ ] Fix any build issues
  - [ ] Create deployment package with `./deploy.sh`

## AWS Account Setup

- [ ] Create AWS account if needed
- [ ] Set up IAM user with appropriate permissions
- [ ] Enable Multi-Factor Authentication (MFA)
- [ ] Set up billing alerts

## Database Setup (RDS)

- [ ] Launch PostgreSQL RDS instance
  - [ ] Choose appropriate instance type
  - [ ] Configure storage settings
  - [ ] Set up security groups
  - [ ] Configure backup settings
- [ ] Note connection details
  - [ ] Database endpoint: ________________
  - [ ] Port: ________________ (usually 5432)
  - [ ] Master username: ________________
  - [ ] Master password: ________________
  - [ ] Database name: ________________
- [ ] Test connection from local machine
- [ ] Update .env.production with database details

## EC2 Setup

- [ ] Launch EC2 instance
  - [ ] Choose appropriate instance type
  - [ ] Configure security groups (SSH, HTTP, HTTPS)
  - [ ] Set up key pair for SSH access
- [ ] Connect to instance and basic setup
  - [ ] Update system packages
  - [ ] Install Node.js
  - [ ] Install Git
  - [ ] Install PostgreSQL client
  - [ ] Install PM2
  - [ ] Install Nginx
  - [ ] Install Certbot

## Application Deployment

- [ ] Transfer application files to EC2
  - [ ] Via Git clone or
  - [ ] Via SCP file transfer
- [ ] Configure environment
  - [ ] Update .env.production with proper values
  - [ ] Test database connection
- [ ] Build and start application
  - [ ] Install dependencies: `npm install`
  - [ ] Build application: `npm run build`
  - [ ] Configure PM2: `pm2 start ecosystem.config.js`
  - [ ] Set PM2 to start on boot: `pm2 startup` and `pm2 save`
- [ ] Set up database
  - [ ] Run migrations: `node migrate-prod.js`
  - [ ] Verify tables created correctly

## Web Server Setup

- [ ] Configure Nginx
  - [ ] Create server block configuration
  - [ ] Enable site configuration
  - [ ] Test configuration
  - [ ] Restart Nginx
- [ ] Set up SSL with Certbot
  - [ ] Run Certbot for your domain
  - [ ] Test HTTPS access
  - [ ] Verify auto-renewal is configured

## Domain Configuration

- [ ] Set up domain in Route 53 (or your DNS provider)
  - [ ] Create hosted zone
  - [ ] Add A record pointing to EC2 instance
  - [ ] Configure www subdomain if needed
- [ ] Wait for DNS propagation
- [ ] Test domain access

## Post-Deployment

- [ ] Set up monitoring
  - [ ] Configure CloudWatch for EC2 and RDS
  - [ ] Set up log rotations
  - [ ] Set up alerts for key metrics
- [ ] Configure backups
  - [ ] Set up database backup script
  - [ ] Configure automated backups
- [ ] Perform security hardening
  - [ ] Review security groups
  - [ ] Install and configure Fail2Ban
  - [ ] Close unnecessary ports
- [ ] Test application functionality
  - [ ] User registration and login
  - [ ] Quiz creation
  - [ ] Quiz participation
  - [ ] Results and analytics

## Documentation

- [ ] Record all configuration details
  - [ ] Server IP and access information
  - [ ] Database connection details
  - [ ] Domain and DNS settings
- [ ] Document maintenance procedures
  - [ ] How to update the application
  - [ ] How to restore from backups
  - [ ] How to monitor the application

## Training and Handover

- [ ] Provide training on deployment process
- [ ] Ensure all documentation is complete
- [ ] Conduct handover session

## Final Verification

- [ ] Perform load testing
- [ ] Verify all application features work
- [ ] Check SSL certificates are valid
- [ ] Ensure backups are working
- [ ] Verify monitoring is functioning

## Notes

Use this space to track any specific details or issues encountered during deployment:
