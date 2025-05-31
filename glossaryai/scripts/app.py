from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import re
import os

app = Flask(__name__)
CORS(app)

# Database configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "glossary.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database Models
class Term(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    main_term = db.Column(db.String(200), nullable=False, unique=True)
    definition = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    aliases = db.relationship('Alias', backref='term', lazy=True, cascade='all, delete-orphan')

class Alias(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    alias = db.Column(db.String(200), nullable=False, unique=True)
    term_id = db.Column(db.Integer, db.ForeignKey('term.id'), nullable=False)

# Create tables
with app.app_context():
    db.create_all()

# Helper function to parse input
def parse_glossary_input(text):
    """
    Expected format:
    Term: Main Term
    Aliases: Alias1, Alias2, Alias3 (optional)
    Category: Medical/Tech/etc (optional)
    Definition: The definition text
    """
    lines = text.strip().split('\n')
    data = {}
    current_key = None
    
    for line in lines:
        if line.strip():
            if ':' in line and not current_key:
                key, value = line.split(':', 1)
                key = key.strip().lower()
                value = value.strip()
                
                if key in ['term', 'aliases', 'category', 'definition']:
                    data[key] = value
                    current_key = key if key == 'definition' else None
            elif current_key == 'definition':
                # Append to definition if it's multi-line
                data['definition'] = data.get('definition', '') + ' ' + line.strip()
    
    # Parse aliases
    if 'aliases' in data:
        data['aliases'] = [a.strip() for a in data['aliases'].split(',') if a.strip()]
    else:
        data['aliases'] = []
    
    return data

# Routes
@app.route('/api/terms', methods=['GET'])
def get_terms():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')
    category = request.args.get('category', '')
    
    query = Term.query
    
    if search:
        # Search in main term and aliases
        search_pattern = f'%{search}%'
        query = query.filter(
            db.or_(
                Term.main_term.ilike(search_pattern),
                Term.aliases.any(Alias.alias.ilike(search_pattern))
            )
        )
    
    if category:
        query = query.filter(Term.category == category)
    
    query = query.order_by(Term.main_term)
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    
    terms = []
    for term in paginated.items:
        terms.append({
            'id': term.id,
            'main_term': term.main_term,
            'definition': term.definition,
            'category': term.category,
            'aliases': [alias.alias for alias in term.aliases],
            'created_at': term.created_at.isoformat(),
            'updated_at': term.updated_at.isoformat()
        })
    
    return jsonify({
        'terms': terms,
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    })

@app.route('/api/terms', methods=['POST'])
def add_term():
    try:
        data = request.json
        
        # If raw text is provided, parse it
        if 'raw_text' in data:
            parsed_data = parse_glossary_input(data['raw_text'])
            if 'term' not in parsed_data or 'definition' not in parsed_data:
                return jsonify({'error': 'Invalid format. Must include Term and Definition.'}), 400
            data = parsed_data
            data['main_term'] = data.pop('term')
        
        # Validate required fields
        if not data.get('main_term') or not data.get('definition'):
            return jsonify({'error': 'Main term and definition are required.'}), 400
        
        # Check if term already exists
        existing_term = Term.query.filter_by(main_term=data['main_term']).first()
        if existing_term:
            return jsonify({'error': f'Term "{data["main_term"]}" already exists.'}), 409
        
        # Check if any alias already exists
        for alias in data.get('aliases', []):
            existing_alias = Alias.query.filter_by(alias=alias).first()
            if existing_alias:
                return jsonify({
                    'error': f'Alias "{alias}" already exists for term "{existing_alias.term.main_term}".'
                }), 409
        
        # Create new term
        new_term = Term(
            main_term=data['main_term'],
            definition=data['definition'],
            category=data.get('category')
        )
        db.session.add(new_term)
        db.session.flush()  # Get the ID before adding aliases
        
        # Add aliases
        for alias in data.get('aliases', []):
            new_alias = Alias(alias=alias, term_id=new_term.id)
            db.session.add(new_alias)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Term added successfully',
            'id': new_term.id,
            'main_term': new_term.main_term
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/terms/<int:term_id>', methods=['PUT'])
def update_term(term_id):
    try:
        term = Term.query.get_or_404(term_id)
        data = request.json
        
        # Update main fields
        if 'main_term' in data:
            # Check if new main_term already exists
            existing = Term.query.filter(
                Term.main_term == data['main_term'],
                Term.id != term_id
            ).first()
            if existing:
                return jsonify({'error': f'Term "{data["main_term"]}" already exists.'}), 409
            term.main_term = data['main_term']
        
        if 'definition' in data:
            term.definition = data['definition']
        
        if 'category' in data:
            term.category = data['category']
        
        # Update aliases
        if 'aliases' in data:
            # Remove old aliases
            Alias.query.filter_by(term_id=term_id).delete()
            
            # Add new aliases
            for alias in data['aliases']:
                # Check if alias exists for another term
                existing_alias = Alias.query.join(Term).filter(
                    Alias.alias == alias,
                    Term.id != term_id
                ).first()
                if existing_alias:
                    return jsonify({
                        'error': f'Alias "{alias}" already exists for term "{existing_alias.term.main_term}".'
                    }), 409
                
                new_alias = Alias(alias=alias, term_id=term_id)
                db.session.add(new_alias)
        
        term.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Term updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/terms/<int:term_id>', methods=['DELETE'])
def delete_term(term_id):
    try:
        term = Term.query.get_or_404(term_id)
        db.session.delete(term)
        db.session.commit()
        return jsonify({'message': 'Term deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/categories', methods=['GET'])
def get_categories():
    categories = db.session.query(Term.category).distinct().filter(Term.category.isnot(None)).all()
    return jsonify([cat[0] for cat in categories])

@app.route('/api/export', methods=['GET'])
def export_terms():
    terms = Term.query.all()
    export_data = []
    
    for term in terms:
        export_data.append({
            'main_term': term.main_term,
            'definition': term.definition,
            'category': term.category,
            'aliases': [alias.alias for alias in term.aliases]
        })
    
    return jsonify(export_data)

if __name__ == '__main__':
    app.run(debug=True, port=5000)