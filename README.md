# LasCoTorras.com (Node.js + MongoDB)

Implementación full-stack inicial basada en la documentación funcional.

## Requisitos
- Node.js 24+
- MongoDB local o remoto

## Configuración rápida
1. Crea `.env` desde `.env.example`.
2. Configura al menos:
   - `MONGODB_URI`
   - `SESSION_SECRET`
   - `APP_URL`
   - `PORT`
3. Inicia app.

## Variables de entorno soportadas
### App
- `PORT`
- `NODE_ENV`
- `APP_URL`
- `SESSION_SECRET`

### MongoDB
- `MONGODB_URI`
- `MONGODB_DB_NAME`

### SMTP completo
- `SMTP_ENABLED`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SMTP_TLS_REJECT_UNAUTHORIZED`

### Discord OAuth
- `DISCORD_OAUTH_ENABLED`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI`

## Discord login
- Endpoint inicio: `/auth/discord`
- Callback: `/auth/discord/callback`
- Scope utilizado: `identify email`

## Deploy en Pterodactyl
- **Main File:** `index.js`
- **Additional Arguments (opcional):** `--trace-warnings`
- Variables mínimas: `MONGODB_URI`, `SESSION_SECRET`, `APP_URL`, `PORT`
