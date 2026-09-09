# Production deployment

The production stack exposes only Caddy on ports 80/443. MySQL, Laravel,
Next.js and Evolution Go remain on the private Docker network. Evolution Go's
manager is bound to the VM loopback and is reachable only through an SSH
tunnel.

## First deployment

```bash
cp deploy/.env.prod.example deploy/.env.prod
chmod 600 deploy/.env.prod
# Fill every required secret before running any Compose command.
sudo docker compose --env-file deploy/.env.prod -f deploy/docker-compose.prod.yml up -d --build
sudo docker compose --env-file deploy/.env.prod -f deploy/docker-compose.prod.yml ps
```

The `backend` container runs database migrations before PHP-FPM starts. Queue
and scheduler containers wait for the API health check.

## The first administrator

Roles are granted from the admin console at `/admin/utilisateurs`, and reaching
that console requires the `Administrator` role — so a fresh database needs a way
in that does not depend on already being in. Set it in `deploy/.env.prod`:

```dotenv
ADMIN_PHONES=0632594914          # comma-separated; "+212632594914" is the same
```

The entrypoint provisions those numbers as accounts on every deploy, and the API
grants the role on their first OTP request either way. Sign in at `/auth-phone`
with the number — the code arrives over WhatsApp, so the pairing below must be
working first.

The number is not a secret: it names the account, and the code sent to that
handset is what proves it is yours. Removing an entry does **not** revoke the
role; take it away in the console instead.

## WhatsApp pairing

Evolution Go 0.7 requires one-time server activation and a paired WhatsApp
instance. Keep its manager private and tunnel it from the workstation:

```bash
ssh -i ~/.ssh/oracle-recruitment.key -L 4000:127.0.0.1:4000 ubuntu@51.170.131.162
```

Then open `http://localhost:4000`, activate the server, create the instance
using `EVOLUTION_GLOBAL_API_KEY`, and use `EVOLUTION_INSTANCE_TOKEN` as the
instance token. Scan the QR code from the sending WhatsApp account.

## Enable the domain and HTTPS

After the DNS records resolve to the VM, update `deploy/.env.prod`:

```dotenv
SITE_ADDRESS=example.com, www.example.com
PUBLIC_URL=https://example.com
DOMAIN_HOSTS=example.com,www.example.com
SESSION_SECURE_COOKIE=true
```

Apply the change with:

```bash
sudo docker compose --env-file deploy/.env.prod -f deploy/docker-compose.prod.yml up -d --build
```

Caddy obtains and renews TLS certificates automatically. Keep inbound TCP 80
and TCP/UDP 443 open in both Oracle Cloud and the VM firewall.

## Operations

```bash
# Logs
sudo docker compose --env-file deploy/.env.prod -f deploy/docker-compose.prod.yml logs -f --tail=200

# Pull code and rebuild
git pull --ff-only
sudo docker compose --env-file deploy/.env.prod -f deploy/docker-compose.prod.yml up -d --build

# Database backup
sudo docker compose --env-file deploy/.env.prod -f deploy/docker-compose.prod.yml exec -T mysql \
  sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' > recruitment.sql
```
