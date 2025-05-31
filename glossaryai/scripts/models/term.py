from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Term(db.Model):
    __tablename__ = 'term'
    
    id = db.Column(db.Integer, primary_key=True)
    main_term = db.Column(db.String(200), nullable=False, unique=True)
    definition = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    aliases = db.relationship('Alias', backref='term', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert term to dictionary."""
        return {
            'id': self.id,
            'main_term': self.main_term,
            'definition': self.definition,
            'category': self.category,
            'aliases': [alias.alias for alias in self.aliases],
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Term {self.main_term}>'