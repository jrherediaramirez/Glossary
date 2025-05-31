from flask import Flask
from flask_cors import CORS
from models.term import db
from routes import terms_bp, categories_bp
from config import config
import os

def create_app(config_name=None):
    """Application factory pattern."""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'default')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)
    
    # Initialize extensions
    CORS(app)
    db.init_app(app)
    
    # Register blueprints
    app.register_blueprint(terms_bp)
    app.register_blueprint(categories_bp)
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    return app

# Create app instance
app = create_app()

if __name__ == '__main__':
    # For development, Gunicorn will be used in Docker for production
    app.run(debug=True, host='0.0.0.0', port=5000)