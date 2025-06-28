# joyce

to reveal the rich interior of the mind..

## deployment

Doing it on an LXC for now, so using systemd. Installed Go on container first

Expects

- `.env` in `/etc/joyce/.env`
- `joyce` binary in `/usr/local/bin/joyce`
- Upload dir in `/var/lib/joyce/uploads`

```bash
# /etc/systemd/system/joyce.service
[Unit]
Description=Joyce API Service
After=network.target

[Service]
Type=simple
User=root
Group=root
EnvironmentFile=/etc/joyce/.env
WorkingDirectory=/var/lib/joyce
ExecStart=/usr/local/bin/joyce

Restart=on-failure
RestartSec=5s

LimitNOFILE=4096
LimitNPROC=100

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable joyce
sudo systemctl start joyce
```
