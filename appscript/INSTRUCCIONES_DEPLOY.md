# 🚀 Cómo Desplegar el Sistema de Asistencia en Google

## Paso 1 – Abrir Apps Script desde la hoja

1. Abre tu Google Sheet:
   https://docs.google.com/spreadsheets/d/1lfGI10Gf6ka3CaGgMgH1aSvTEd3UIR2M5RKpvak4HRc

2. En el menú superior ve a:
   **Extensiones → Apps Script**

---

## Paso 2 – Copiar los archivos

### Archivo 1: `Code.gs`
- En Apps Script ya existe un archivo `Code.gs` por defecto.
- **Borra todo su contenido** y pega el contenido del archivo `Code.gs` de esta carpeta.

### Archivo 2: `Index.html`
- Haz clic en el botón **"+"** (junto a "Archivos") y elige **"HTML"**.
- Nómbralo exactamente **`Index`** (sin la extensión .html, Apps Script la añade solo).
- **Pega todo el contenido** del archivo `Index.html` de esta carpeta.

---

## Paso 3 – Desplegar como aplicación web

1. Haz clic en el botón azul **"Desplegar"** (arriba a la derecha).
2. Selecciona **"Nueva implementación"**.
3. Configura así:
   - **Tipo:** Aplicación web
   - **Descripción:** Sistema de Asistencia v1
   - **Ejecutar como:** Yo (tu cuenta)
   - **Quién tiene acceso:** Cualquier usuario (o "Cualquier persona con cuenta de Google")
4. Haz clic en **"Desplegar"**.
5. Autoriza los permisos cuando se pidan.
6. Copia la **URL de la aplicación web** que aparece al final.

---

## Paso 4 – ¡Listo!

- Comparte esa URL con quienes necesiten tomar asistencia.
- **Cualquier cambio** en la página web se guarda automáticamente en el Google Sheet.
- **Cualquier cambio en el Sheet** se refleja al recargar la página (botón "Actualizar").

---

## Actualizar la app después de cambios en el código

Si modificas `Code.gs` o `Index.html`:
1. Ve a **Desplegar → Gestionar implementaciones**.
2. Haz clic en el ícono de lápiz (editar).
3. En **Versión** cambia a **"Nueva versión"**.
4. Haz clic en **"Desplegar"**.

---

## Legends de Asistencia

| Código | Significado |
|--------|-------------|
| ✅ P   | Presente    |
| ❌ A   | Ausente     |
| ⏰ T   | Tarde       |
| 📋 J   | Justificado |
