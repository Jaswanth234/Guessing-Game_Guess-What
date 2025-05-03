# AWS Deployment Guide for Quiz Application

This guide provides detailed instructions for deploying the Quiz Application to AWS infrastructure. Follow these steps in order to set up a secure, scalable production environment.

## Prerequisites

- An AWS account
- Basic knowledge of AWS services (EC2, RDS, Route 53)
- A registered domain name (optional but recommended)
- AWS CLI installed on your local machine (optional)

## Step 1: Set Up the RDS Database

1. **Log in to AWS Console**
   - Navigate to the RDS service

2. **Create a PostgreSQL Database**
   - Click "Create database"
   - Select "Standard create"
   - Choose PostgreSQL as the engine
   - Under "Templates" select "Free tier" (for testing) or "Production" (for live)
   
3. **Configure Settings**
   - DB instance identifier: `quiz-app-db`
   - Master username: `quizadmin` (or your choice)
   - Master password: Create a strong password
   - DB instance class: `db.t3.micro` (for testing)
   - Storage: 20GB with autoscaling enabled
   - VPC: Use default VPC for simplicity
   - Public access: "No" for production (Yes only during setup if needed)
   - VPC security group: Create new, or use existing
   - Database authentication: Password authentication
   - Initial database name: `quizdb`
   - Encryption: Enable
   - Backup: Enable automated backups
   - Monitoring: As per your requirements

4. **Finalize and Create**
   - Review all settings
   - Click "Create database"
   - Wait for the database to be created (can take 5-10 minutes)

5. **Configure Security Group**
   - Once created, go to the database details
   - Click on the VPC security group
   - Add a rule to allow inbound PostgreSQL (port 5432) traffic from your EC2 security group
   - Save the changes

6. **Note Connection Details**
   - Copy the database endpoint, port, username, password, and database name
   - You'll need these for your application's .env file

## Step 2: Launch an EC2 Instance

1. **Navigate to EC2 Service**
   - Click "Launch instance"

2. **Choose an Amazon Machine Image (AMI)**
   - Select "Ubuntu Server 20.04 LTS (HVM), SSD Volume Type"

3. **Choose an Instance Type**
   - For testing: t2.micro (eligible for free tier)
   - For production: t3.small or better based on expected load

4. **Configure Instance**
   - Network: Default VPC
   - Auto-assign Public IP: Enable
   - IAM role: Create/select a role with appropriate permissions

5. **Add Storage**
   - Size: 8GB minimum (more if you expect a lot of data)
   - Volume Type: gp2
   - Delete on Termination: Yes (or No if you want to preserve data)

6. **Configure Security Group**
   - Create a new security group
   - Add rules for:
     - SSH (port 22) from your IP
     - HTTP (port 80) from anywhere
     - HTTPS (port 443) from anywhere

7. **Review and Launch**
   - Review your settings
   - Create or select an existing key pair
   - Download the key pair if it's new
   - Launch the instance

## Step 3: Set Up Your EC2 Instance

1. **Connect to Your Instance**
   ```bash
   chmod 400 your-key-pair.pem
   ssh -i your-key-pair.pem ubuntu@your-instance-public-dns
   ```

2. **Update and Install Dependencies**
   ```bash
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 18.x
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install Git
   sudo apt install git -y
   
   # Install PostgreSQL client
   sudo apt install postgresql-client -y
   
   # Install PM2 for process management
   sudo npm install -g pm2
   
   # Install Nginx
   sudo apt install nginx -y
   
   # Install Certbot for SSL
   sudo apt install certbot python3-certbot-nginx -y
   ```

3. **Clone Your Repository (or Upload Files)**
   ```bash
   # If using Git
   git clone https://your-repository-url.git /home/ubuntu/quiz-app
   cd /home/ubuntu/quiz-app
   
   # If uploading files
   # First, upload the archive from your local machine:
   # scp -i your-key-pair.pem quiz-app-deploy.tar.gz ubuntu@your-instance-public-dns:/home/ubuntu/
   
   # Then on the server:
   mkdir -p /home/ubuntu/quiz-app
   tar -xzvf quiz-app-deploy.tar.gz -C /home/ubuntu/quiz-app
   cd /home/ubuntu/quiz-app
   ```

4. **Configure Environment Variables**
   ```bash
   # Create or edit .env.production
   nano .env.production
   ```
   
   Update with your RDS details:
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://quizadmin:your-password@your-rds-endpoint:5432/quizdb
   PORT=5000
   HOST=0.0.0.0
   SESSION_SECRET=your-strong-session-secret
   CORS_ORIGIN=https://your-domain.com
   ```

## Step 4: Set Up the Application

1. **Install Dependencies and Build**
   ```bash
   cd /home/ubuntu/quiz-app
   npm install
   npm run build
   ```

2. **Configure PM2**
   ```bash
   # Start the application with PM2
   pm2 start ecosystem.config.js
   
   # Make PM2 start on system boot
   pm2 startup
   # Run the command given in the output
   
   # Save the current process list
   pm2 save
   ```

3. **Configure Nginx**
   ```bash
   # Create a new Nginx configuration
   sudo nano /etc/nginx/sites-available/quiz-app
   ```
   
   Paste the content from your nginx.conf.template, updating your domain name.
   
   ```bash
   # Create a symbolic link to enable the site
   sudo ln -s /etc/nginx/sites-available/quiz-app /etc/nginx/sites-enabled/
   
   # Verify the configuration
   sudo nginx -t
   
   # If valid, restart Nginx
   sudo systemctl restart nginx
   ```

4. **Set Up SSL with Certbot**
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```
   
   Follow the prompts to complete the SSL setup. Certbot will automatically update your Nginx configuration.

## Step 5: Set Up Database Tables and Initial Data

1. **Run Database Migrations**
   ```bash
   cd /home/ubuntu/quiz-app
   
   # Run the migration script
   node migrate-prod.js
   ```

2. **Verify Database Connection**
   Connect to your database to ensure it's set up correctly:
   ```bash
   psql -h your-rds-endpoint -U quizadmin -d quizdb
   ```
   
   Enter your password when prompted, then run `\dt` to list tables.

## Step 6: Configure Domain Name (If Applicable)

1. **Go to Route 53 in AWS Console**
   - Create a hosted zone for your domain (if not already done)

2. **Create DNS Records**
   - Create an A record pointing to your EC2 instance's public IP address
   - Alternatively, use an Elastic IP to ensure your IP doesn't change on instance restart

3. **Wait for DNS Propagation**
   - Can take up to 48 hours, but often completes in a few minutes to a few hours

## Step 7: Monitoring and Maintenance

1. **Set Up Monitoring**
   ```bash
   # View logs
   pm2 logs
   
   # Monitor application
   pm2 monit
   ```

2. **Set Up Regular Backups**
   Create a script for database backups:
   ```bash
   # Create a backup script
   sudo nano /home/ubuntu/backup-db.sh
   ```
   
   Add content:
   ```bash
   #!/bin/bash
   BACKUP_DIR="/home/ubuntu/backups"
   TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
   
   mkdir -p $BACKUP_DIR
   
   # Backup the database
   PGPASSWORD=your-password pg_dump -h your-rds-endpoint -U quizadmin -d quizdb > $BACKUP_DIR/quizdb_$TIMESTAMP.sql
   
   # Keep only the last 7 backups
   ls -tp $BACKUP_DIR/quizdb_*.sql | grep -v '/$' | tail -n +8 | xargs -I {} rm -- {}
   ```
   
   Make it executable:
   ```bash
   chmod +x /home/ubuntu/backup-db.sh
   ```
   
   Add to crontab to run daily:
   ```bash
   crontab -e
   ```
   
   Add:
   ```
   0 2 * * * /home/ubuntu/backup-db.sh
   ```

## Step 8: Security Best Practices

1. **Update Regularly**
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y
   
   # Update Node.js dependencies
   cd /home/ubuntu/quiz-app
   npm update
   ```

2. **Configure AWS Security**
   - Enable AWS CloudTrail
   - Use IAM roles with least privilege
   - Enable MFA for your AWS account
   - Consider AWS Shield for DDoS protection

3. **Add Fail2Ban (Protect Against Brute Force Attacks)**
   ```bash
   sudo apt install fail2ban -y
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

## Troubleshooting

### Application Issues
- Check application logs: `pm2 logs`
- Restart the application: `pm2 restart quiz-app`
- Verify environment variables: `nano /home/ubuntu/quiz-app/.env.production`

### Database Issues
- Test database connection: `psql -h your-rds-endpoint -U quizadmin -d quizdb`
- Check security group settings in AWS console
- Verify the DATABASE_URL in your .env.production file

### Nginx Issues
- Check Nginx logs: `sudo nano /var/log/nginx/error.log`
- Test config: `sudo nginx -t`
- Restart Nginx: `sudo systemctl restart nginx`

### SSL Issues
- Renew certificates: `sudo certbot renew`
- Force renewal: `sudo certbot --force-renewal`
- Check certificate status: `sudo certbot certificates`

## Scaling Considerations

As your application grows, consider:

1. **Auto Scaling Group for EC2**
   - Create an AMI of your configured instance
   - Set up an Auto Scaling group
   - Configure scale out/in policies

2. **Load Balancer**
   - Set up an Application Load Balancer (ALB)
   - Configure health checks
   - Route traffic across multiple instances

3. **Database Scaling**
   - Increase RDS instance size
   - Add read replicas
   - Consider sharding for very large deployments

4. **Content Delivery Network (CDN)**
   - Use CloudFront to distribute static assets
   - Configure caching policies

## Estimated Costs

For a basic deployment (as outlined above):
- EC2 t2.micro: ~$8-10/month (or free tier eligible)
- RDS t3.micro: ~$15-20/month (or free tier eligible)
- Route 53: ~$0.50/month per hosted zone + $0.40/million queries
- Data transfer: Variable based on usage

For a production deployment with more resources:
- EC2 t3.small or medium: $30-60/month
- RDS t3.small with Multi-AZ: $75-100/month
- Application Load Balancer: ~$20/month
- Route 53: Same as above
- CloudFront: Variable based on usage
- Data transfer: Variable based on usage

## Conclusion

You now have a production-ready Quiz Application running on AWS infrastructure. This setup provides a scalable, secure foundation that can be expanded as your application grows.

Remember to:
- Regularly backup your data
- Keep your software updated
- Monitor your resources for unusual activity
- Scale resources as needed based on usage patterns

For additional support, refer to the AWS documentation or engage with AWS support services.