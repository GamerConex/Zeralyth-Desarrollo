# LasCoTorras.com (Node.js + MongoDB)

Implementación full-stack inicial basada en la documentación funcional.

## Requisitos
- Node.js 20+
- MongoDB local o remoto

## Configuración
1. Copia `.env.example` a `.env`.
2. Ajusta `MONGODB_URI` y `SESSION_SECRET`.
3. Instala dependencias:
   ```bash
   npm install
   ```
4. Carga datos base:
   ```bash
   npm run seed
   ```
5. Inicia en desarrollo:
   ```bash
   npm run dev
   ```

## Rutas principales
- `/` home
- `/recursos` listado
- `/recursos/nuevo` crear recurso (requiere login)
- `/tickets` tickets (requiere login)
- `/login` y `/registro`
- `/panel` panel owner

## Seguridad incluida
- Hash de contraseñas con bcrypt
- Sesiones con express-session
- Restricción de rutas privadas

## Pendiente para producción
- Subida real de archivos (S3/Cloudinary)
- OAuth Discord
- API REST para frontend moderno
- Tests automatizados


## Deploy en Pterodactyl (sin tocar startup command)
- **Main File:** `index.js`
- **Additional Arguments (opcional):** `--trace-warnings`
- Si tu panel instala dependencias automáticamente, con eso basta para iniciar.
- Configura variables de entorno en el panel: `MONGODB_URI`, `SESSION_SECRET`, `PORT` (si aplica), y opcional SMTP.
- La app ahora auto-crea roles/categorías base en el primer arranque (no necesitas correr `npm run seed`).
