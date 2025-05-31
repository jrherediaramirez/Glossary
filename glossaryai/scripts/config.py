import os

class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Database configuration
    BASEDIR = os.path.abspath(os.path.dirname(__file__))
    DATA_DIR = os.path.join(BASEDIR, 'db_data')
    
    @classmethod
    def init_app(cls, app):
        # Ensure data directory exists
        os.makedirs(cls.DATA_DIR, exist_ok=True)

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.join(Config.DATA_DIR, "glossary.db")}'

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.join(Config.DATA_DIR, "glossary.db")}'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}