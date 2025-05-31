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
# Define a data directory for the database
DATA_DIR = os.path.join(basedir, 'db_data')
os.makedirs(DATA_DIR, exist_ok=True) # Ensure the directory exists

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(DATA_DIR, "glossary.db")}'
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
            if ':' in line and not current_key: # Ensure ':' is part of a key-value pair start, not in definition
                parts = line.split(':', 1)
                if len(parts) == 2:
                    key, value = parts
                    key = key.strip().lower()
                    value = value.strip()
                    
                    if key in ['term', 'aliases', 'category', 'definition']:
                        data[key] = value
                        current_key = key if key == 'definition' else None # Set current_key only for definition
                    else: # If key is not recognized, it might be part of a multi-line definition
                        if current_key == 'definition':
                             data['definition'] = data.get('definition', '') + '\n' + line.strip()
                elif current_key == 'definition': # Line does not contain ':' but we are in a definition block
                    data['definition'] = data.get('definition', '') + '\n' + line.strip()

            elif current_key == 'definition':
                # Append to definition if it's multi-line
                data['definition'] = data.get('definition', '') + '\n' + line.strip() # Changed ' ' to '\n' for better formatting
    
    # Post-process definition to ensure it's a single string
    if 'definition' in data:
        data['definition'] = data['definition'].strip()

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
            # Ensure 'term' key is correctly mapped to 'main_term'
            parsed_data['main_term'] = parsed_data.pop('term')
            data = parsed_data # Overwrite data with parsed_data
        
        # Validate required fields
        if not data.get('main_term') or not data.get('definition'):
            return jsonify({'error': 'Main term and definition are required.'}), 400
        
        # Check if term already exists
        existing_term = Term.query.filter_by(main_term=data['main_term']).first()
        if existing_term:
            return jsonify({'error': f'Term "{data["main_term"]}" already exists.'}), 409
        
        # Check if any alias already exists
        for alias_str in data.get('aliases', []):
            existing_alias = Alias.query.filter_by(alias=alias_str).first()
            if existing_alias:
                return jsonify({
                    'error': f'Alias "{alias_str}" already exists for term "{existing_alias.term.main_term}".'
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
        for alias_str in data.get('aliases', []):
            new_alias = Alias(alias=alias_str, term_id=new_term.id)
            db.session.add(new_alias)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Term added successfully',
            'id': new_term.id,
            'main_term': new_term.main_term
        }), 201
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error adding term: {e}", exc_info=True) # Log the full exception
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
        
        if 'category' in data: # Allow setting category to None or empty string
            term.category = data.get('category')
        
        # Update aliases
        if 'aliases' in data:
            # Remove old aliases
            Alias.query.filter_by(term_id=term_id).delete()
            
            # Add new aliases
            for alias_str in data.get('aliases', []): # Ensure it's data.get('aliases', [])
                if not alias_str: continue # Skip empty aliases
                # Check if alias exists for another term
                existing_alias = Alias.query.join(Term).filter(
                    Alias.alias == alias_str,
                    Term.id != term_id
                ).first()
                if existing_alias:
                    return jsonify({
                        'error': f'Alias "{alias_str}" already exists for term "{existing_alias.term.main_term}".'
                    }), 409
                
                new_alias = Alias(alias=alias_str, term_id=term_id)
                db.session.add(new_alias)
        
        term.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Term updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error updating term {term_id}: {e}", exc_info=True)
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
        app.logger.error(f"Error deleting term {term_id}: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/categories', methods=['GET'])
def get_categories():
    categories = db.session.query(Term.category).distinct().filter(Term.category.isnot(None), Term.category != '').all()
    return jsonify([cat[0] for cat in categories if cat[0]]) # Ensure category is not empty

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
    # For development, Gunicorn will be used in Docker for production
    app.run(debug=True, host='0.0.0.0', port=5000)
