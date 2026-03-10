from app_core import create_app
from app_core.auth import is_connected
from app_core.routes import get_local_ip

app = create_app()


if __name__ == "__main__":
    local_ip = get_local_ip()
    connected = is_connected()
    print("=" * 58)
    print("  Sistema de Asistencia - Ensueno")
    print("=" * 58)
    if connected:
        print("  Conectado a Google Sheets")
    else:
        print("  DEMO - necesita autorizacion")
        print()
        print("  PASO 1: agrega esta URI en Google Cloud Console:")
        print("     http://localhost:5000/oauth2callback")
        print("     (Credenciales > tu cliente OAuth > URIs de redireccionamiento)")
        print()
        print("  PASO 2: Abre en el navegador:")
        print("     http://localhost:5000/auth")
    print()
    print(f"  Local:   http://localhost:5000")
    print(f"  Celular: http://{local_ip}:5000")
    print("=" * 58)
    app.run(debug=False, host="0.0.0.0", port=5000)
