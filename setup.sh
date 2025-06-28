#!/bin/bash

sudo mkdir -p /etc/joyce
sudo cp .env /etc/joyce
sudo chown root:root /etc/joyce
sudo chmod 600 /etc/joyce/.env

sudo mkdir -p /var/lib/joyce/uploads
sudo chown -R root:root /var/lib/joyce

# copy binary
sudo cp ./joyce /usr/local/bin/
sudo chown root:root /usr/local/bin/joyce
sudo chmod 755 /usr/local/bin/joyce
