# Deploy profesional en Vercel (Flask + Google OAuth + Sheets)

## 1) Preparación en Google Cloud

1. Habilita APIs:
   - Google Sheets API
   - Google Drive API
2. Crea un cliente OAuth tipo **Web application**.
3. En **Authorized redirect URIs** agrega:
   - `https://TU-DOMINIO.vercel.app/oauth2callback`
4. Crea/descarga la cuenta de servicio y comparte la hoja con su email.

---

## 2) Variables de entorno en Vercel

En **Project Settings → Environment Variables** configura:

- `SECRET_KEY` = cadena larga aleatoria (mínimo 32 chars)
- `GOOGLE_CREDENTIALS_JSON` = JSON completo del cliente OAuth (una sola línea)
- `GOOGLE_SERVICE_ACCOUNT_JSON` = JSON completo de la service account (una sola línea)
- `ALLOWED_EMAILS` = correos permitidos separados por coma
- `ADMIN_EMAILS` = correos admin separados por coma
- `REDIRECT_URI` = `https://TU-DOMINIO.vercel.app/oauth2callback`
- `SESSION_HOURS` = `12` (o el valor que prefieras)
- `APP_DEBUG` = `0`

## 3) Verifica archivos sensibles

Este proyecto ya incluye reglas para no subir secretos:

- `.vercelignore`
- `.gitignore`

Aun así, confirma que **no** estén en el repo ni en el deploy:

- `credentials.json`
- `service_account.json`
- `token.json`
- `.env*`

---

## 4) Deploy

Desde `asistencia_python/`:

```bash
vercel --prod
```

Si usas panel de Vercel, conecta esa carpeta como Root Directory.

---

## 5) Validación post-deploy

1. Estado app:
   - `https://TU-DOMINIO.vercel.app/healthz`
2. Estado auth/config:
   - `https://TU-DOMINIO.vercel.app/api/status`
3. Flujo login:
   - abrir `https://TU-DOMINIO.vercel.app/auth`
4. Confirmar lectura y guardado de asistencia.
5. Confirmar que endpoints admin (`/api/fix/*`, `/api/debug/chars`) solo respondan a admins.

---

## 6) Checklist de seguridad mínima

- `SECRET_KEY` fuerte y rotado periódicamente.
- `ALLOWED_EMAILS` y `ADMIN_EMAILS` definidos.
- `APP_DEBUG=0` en producción.
- Hoja compartida solo con la service account necesaria.
- Revisar logs de Vercel después de cada release.

---

## 7) Rollback rápido

Si algo falla:

1. Vercel → Deployments.
2. Selecciona la versión anterior estable.
3. `Promote to Production`.

Con esto recuperas servicio en segundos.