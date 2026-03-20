# Sistema de Asistencia FUSDEC

Repositorio unificado del sistema de asistencia, con dos implementaciones:

- `appscript/`: versión Google Apps Script (frontend + backend dentro de Google Sheets).
- `python/`: versión Flask (backend Python + plantillas HTML), apta para local y Vercel.

---

## 1) Estructura del proyecto

```text
asistencia_unificada/
├── README.md
├── .gitignore
├── credentials/                  # credenciales externas (no se versionan)
│   ├── client_secret_...json
│   └── thinking-banner-...json
├── appscript/
│   ├── Code.gs
│   ├── Index.html
│   └── INSTRUCCIONES_DEPLOY.md
└── python/
    ├── app.py
    ├── app_core/
    │   ├── __init__.py
    │   ├── auth.py
    │   ├── config.py
    │   ├── demo.py
    │   ├── routes.py
    │   └── sheets.py
    ├── templates/
    ├── requirements.txt
    ├── DEPLOY_VERCEL.md
    ├── CREDENCIALES.md
    └── vercel.json
```

---

## 2) ¿Qué versión usar?

### Opción A — `appscript/` (rápida y simple)
Usa esta opción si quieres todo dentro de Google (sin servidor propio).

- Ventajas: despliegue rápido, mantenimiento mínimo.
- Ideal para: equipos pequeños o uso inmediato.

### Opción B — `python/` (más escalable y controlable)
Usa esta opción si necesitas autenticación más robusta, endpoints API y despliegue profesional.

- Ventajas: arquitectura modular, mejor extensibilidad.
- Ideal para: crecimiento, auditoría, integración con otros servicios.

---

## 3) Configuración rápida (versión Python)

## Requisitos

- Python 3.10+
- Cuenta de Google Cloud con:
  - Google Sheets API habilitada
  - Google Drive API habilitada
- Credenciales OAuth y Service Account

## Instalación local

1. Entra a la carpeta `python/`:

```bash
cd python
```

2. (Opcional) crea entorno virtual:

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

3. Instala dependencias:

```bash
pip install -r requirements.txt
```

4. Coloca credenciales (solo desarrollo local):

- `python/credentials.json` (OAuth client)
- `python/service_account.json` (service account)

5. Ejecuta la app:

```bash
python app.py
```

6. Abre en navegador:

- `http://localhost:5000`
- Estado general: `http://localhost:5000/api/status`
- Salud del servicio: `http://localhost:5000/healthz`

---

## 4) Flujo de autenticación (Python)

1. El usuario entra a `/auth`.
2. Google OAuth valida identidad.
3. Se crea sesión Flask.
4. La lectura/escritura del Sheet se hace con Service Account.
5. APIs protegidas por decoradores (`api_login_required`, `api_admin_required`).

---

## 5) Variables de entorno recomendadas (producción)

Configúralas en Vercel (o en tu plataforma):

- `SECRET_KEY`: cadena larga aleatoria.
- `GOOGLE_CREDENTIALS_JSON`: JSON OAuth en una sola línea.
- `GOOGLE_SERVICE_ACCOUNT_JSON`: JSON de service account en una sola línea.
- `REDIRECT_URI`: `https://TU-DOMINIO.vercel.app/oauth2callback`
- `ALLOWED_EMAILS`: correos permitidos separados por coma.
- `ADMIN_EMAILS`: correos admin separados por coma.
- `SESSION_HOURS`: por ejemplo `12`.
- `APP_DEBUG`: `0` en producción.

---

## 6) Deploy en Vercel (Python)

Desde `python/`:

```bash
vercel --prod
```

Alternativa (proyecto apuntando a la raíz del repo):

- Este repositorio incluye `vercel.json` en la raíz para enrutar a `python/app.py`.
- Si tu proyecto en Vercel tiene **Root Directory = /** (raíz), también funcionará.
- Si prefieres, puedes usar **Root Directory = python** y mantener el flujo original.

Validación post deploy:

1. `https://TU-DOMINIO.vercel.app/healthz`
2. `https://TU-DOMINIO.vercel.app/api/status`
3. Prueba login en `https://TU-DOMINIO.vercel.app/auth`
4. Prueba lectura y guardado de asistencia

Referencia ampliada: `python/DEPLOY_VERCEL.md`.

---

## 6B) Deploy en Google Cloud Run (Python)

Requisitos previos:

- Proyecto de Google Cloud activo
- APIs habilitadas: Cloud Run, Cloud Build, Artifact Registry
- `gcloud` instalado y autenticado

Comandos desde la raíz del repo:

```bash
cd python
gcloud run deploy asistencia-fusdec \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

Variables de entorno recomendadas en Cloud Run:

- `SECRET_KEY`
- `GOOGLE_CREDENTIALS_JSON`
- `GOOGLE_SERVICE_ACCOUNT_JSON`
- `ALLOWED_EMAILS`
- `ADMIN_EMAILS`
- `REDIRECT_URI` = `https://TU-SERVICIO.run.app/oauth2callback`
- `SESSION_HOURS` = `12`
- `APP_DEBUG` = `0`

Después del primer deploy, actualiza en Google Cloud OAuth Client la URI de redirección:

- `https://TU-SERVICIO.run.app/oauth2callback`

Validación rápida:

1. `https://TU-SERVICIO.run.app/api/status`
2. `https://TU-SERVICIO.run.app/auth`
3. Probar lectura/guardado de asistencia

---

## 7) Deploy Google Apps Script (appscript)

1. Abre tu Google Sheet objetivo.
2. Ve a **Extensiones > Apps Script**.
3. Copia `appscript/Code.gs` sobre el `Code.gs` del proyecto.
4. Crea archivo HTML `Index` y pega `appscript/Index.html`.
5. Despliega como **Aplicación web**:
   - Ejecutar como: tú
   - Acceso: según necesidad (cuenta Google o público)

Referencia ampliada: `appscript/INSTRUCCIONES_DEPLOY.md`.

---

## 8) Seguridad (importante)

- No subas credenciales a Git.
- Mantén `credentials/` y archivos sensibles fuera de commits.
- Rota claves si alguna vez fueron expuestas.
- Define `ALLOWED_EMAILS` y `ADMIN_EMAILS` en producción.
- Usa `APP_DEBUG=0` en producción.

Este repositorio ya incluye reglas de exclusión en `.gitignore`.

---

## 9) Comandos útiles

Desde la raíz del repo:

```bash
# Ver estado git
git status

# Entrar al backend Python
cd python

# Ejecutar backend
python app.py
```

---

## 10) Mantenimiento recomendado

- Mantener la lógica en `python/app_core/` por módulos (config, auth, rutas, sheets).
- Mantener plantillas en `python/templates/`.
- Registrar cambios de despliegue en un changelog simple.
- Antes de cada release:
  1. validar `/healthz`
  2. validar login OAuth
  3. validar escritura al Sheet

---

## 11) Documentación interna existente

- Arquitectura Python: `python/ARQUITECTURA.md`
- Credenciales local Python: `python/CREDENCIALES.md`
- Deploy Python: `python/DEPLOY_VERCEL.md`
- Deploy Apps Script: `appscript/INSTRUCCIONES_DEPLOY.md`
