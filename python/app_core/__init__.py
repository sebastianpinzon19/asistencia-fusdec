from flask import Flask

from .config import configure_flask_app
from .routes import register_routes


def create_app():
    app = Flask(__name__, template_folder="../templates")
    configure_flask_app(app)
    register_routes(app)
    return app
