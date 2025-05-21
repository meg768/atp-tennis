# Raspberry Pi HTTPS + Apache + Express + MySQL Setup

This document describes the full working setup for serving a secure API from a Raspberry Pi using Apache, Express.js, and MySQL, accessible via HTTPS at **https://tennis.egelberg.se**.

_Last updated: 2025-05-20_

---

## ✅ Overview

- Raspberry Pi runs an Express-based API on port `3004`
- Apache serves HTTPS on port `443` and proxies `/api/*` requests to Express
- Let’s Encrypt certificate secures the site
- Public domain: `https://tennis.egelberg.se`

---

## 🧱 Prerequisites

- Raspberry Pi running Debian (or similar)
- Apache 2.4 installed
- Node.js + Express.js app running on `localhost:3004`
- MySQL/MariaDB backend
- Domain name (tennis.egelberg.se) with DNS pointing to public IP
- Port 443 forwarded to Pi in Google WiFi settings

---

## ⚙️ Express Server Structure

```js
const express = require('express');
const app = express();
const api = express.Router();

api.get('/ping', (req, res) => res.json({ message: 'pong' }));

api.post('/query', async (req, res) => {
  const result = await mysql.query(req.body);
  res.json(result);
});

app.use('/api', api);

app.listen(3004, () => {
  console.log('Express running on http://localhost:3004');
});
```

---

## 🔐 Apache SSL + Proxy Configuration

Edit file: `/etc/apache2/sites-available/tennis.egelberg.se-le-ssl.conf`

```apache
<IfModule mod_ssl.c>
  <VirtualHost *:443>
    ServerName tennis.egelberg.se

    ProxyPreserveHost On
    ProxyPass /api http://localhost:3004/api nocanon
    ProxyPassReverse /api http://localhost:3004/api

    DocumentRoot /var/www/html/vitel

    <Directory /var/www/html/vitel>
      Options Indexes FollowSymLinks
      AllowOverride All
      Require all granted
    </Directory>

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/tennis.egelberg.se/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/tennis.egelberg.se/privkey.pem
    Include /etc/letsencrypt/options-ssl-apache.conf

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
  </VirtualHost>
</IfModule>
```

---

## 🔌 Apache Commands

Enable modules:

```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
```

Disable conflicting site:

```bash
sudo a2dissite 000-default-le-ssl.conf
```

Enable your correct site:

```bash
sudo a2ensite tennis.egelberg.se-le-ssl.conf
```

Then reload:

```bash
sudo systemctl reload apache2
```

---

## 🔎 Debugging Tips

- Confirm vhost with:
  ```bash
  apachectl -S
  ```
- Confirm port 443 is forwarded in your router (Google WiFi)
- Watch logs:
  ```bash
  sudo tail -f /var/log/apache2/access.log
  sudo tail -f /var/log/apache2/error.log
  ```

---

## ✅ Testing

From your Mac or any external client:

```bash
curl https://tennis.egelberg.se/api/ping
# → {"message":"pong"}

curl -X POST https://tennis.egelberg.se/api/query \
  -H "Content-Type: application/json" \
  -d '{"sql":"SELECT 1"}'
# → [{"1":1}]
```

---

## 🔄 Certificate Renewal

Dry-run auto-renewal test for Let’s Encrypt:

```bash
sudo certbot renew --dry-run
```

---

## 🎉 Final Note

You're now running a secure full-stack API on a Raspberry Pi, protected with HTTPS, reverse-proxied through Apache, and fully integrated with a live database.  
Well done, Magnus!
