# 🔑 Conectar con tu Google Sheet (3 pasos)

Este sistema usa **tu propia cuenta de Google** — no necesitás compartir la hoja con nadie.
La primera vez se abre el navegador para autorizar, y ya nunca más.

---

## Paso 1 — Instalar dependencias

```bash
pip install -r requirements.txt
```

---

## Paso 2 — Crear credenciales OAuth2 en Google Cloud

1. Abre: https://console.cloud.google.com/
2. **Crear proyecto nuevo** → ponle cualquier nombre (ej: "Asistencia")
3. En el menú izquierdo → **APIs y Servicios → Biblioteca**
   - Busca **Google Sheets API** → Habilitar
   - Busca **Google Drive API** → Habilitar
4. Ve a **APIs y Servicios → Credenciales**
5. Clic en **"+ Crear credenciales" → ID de cliente de OAuth 2.0**
6. Si pide configurar pantalla de consentimiento → elige **Externo** → completa solo el nombre de la app → Guardar
7. En tipo de aplicación elige: **Aplicación de escritorio**
8. Ponle cualquier nombre → **Crear**
9. Descarga el JSON con el botón ⬇️
10. **Renombra el archivo descargado a `credentials.json`**
11. **Cópialo a esta carpeta:** `asistencia_python/credentials.json`

---

## Paso 3 — Ejecutar

```bash
python app.py
```

- La **primera vez** se abre el navegador → iniciás sesión con tu cuenta de Google → clic en **Permitir**
- Se guarda un `token.json` → las próximas veces **ya no pide autorización**
- Abre la app en: **http://localhost:5000**
- Desde celular (misma WiFi): **http://192.168.X.X:5000** (la IP aparece en la terminal)

---

## Estructura de archivos

```
asistencia_python/
├── app.py              ← Backend Flask
├── credentials.json    ← Tu OAuth2 JSON (NO subir a git)
├── token.json          ← Se crea automáticamente tras autorizar
├── requirements.txt
├── templates/
│   └── index.html
└── CREDENCIALES.md
```

---

## ¿Sigue sin conectar?

Visita http://localhost:5000/api/status para ver el diagnóstico exacto del error.
