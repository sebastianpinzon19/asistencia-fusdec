# Estructura del proyecto (escalable)

## Entrada principal
- `app.py`: arranque de Flask y banner de consola.

## Núcleo modular (`app_core/`)
- `__init__.py`: fábrica `create_app()`.
- `config.py`: configuración global, constantes y cookies/sesión.
- `auth.py`: OAuth, sesión, decoradores de acceso.
- `sheets.py`: acceso a Google Sheets y utilidades de datos.
- `demo.py`: datos de demostración y valores permitidos.
- `routes.py`: definición de rutas web/API.

## Vistas
- `templates/`: `index.html`, `login.html`, `logs.html`, `blocked.html`.

## Archivos sensibles
- `credentials.json` y `service_account.json` se mantienen por compatibilidad local.
- Ya están ignorados por `.gitignore`.

## Nota
Esta reorganización mantiene las rutas existentes y prepara el código para crecer por módulos sin convertir `app.py` en un archivo gigante.
