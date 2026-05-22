#!/bin/bash

echo "Starting deployment..."
sudo -u root whoami
sudo -u root su
sudo -u bun install
# Reload the application using pm2
sudo -u root service app1 restart
echo "Deployment completed successfully."