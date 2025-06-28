#!/bin/bash

go build .
sudo systemctl stop joyce
cp ./joyce /usr/local/bin/joyce
sudo systemctl start joyce