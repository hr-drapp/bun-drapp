#!/bin/bash

# Reload the application using pm2
sudo -u root systemctl restart matka-ctrl-v2
sudo -u root systemctl --no-pager --full status matka-ctrl-v2
