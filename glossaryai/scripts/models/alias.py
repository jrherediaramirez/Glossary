from .term import db

class Alias(db.Model):
    __tablename__ = 'alias'
    
    id = db.Column(db.Integer, primary_key=True)
    alias = db.Column(db.String(200), nullable=False, unique=True)
    term_id = db.Column(db.Integer, db.ForeignKey('term.id'), nullable=False)
    
    def __repr__(self):
        return f'<Alias {self.alias}>'