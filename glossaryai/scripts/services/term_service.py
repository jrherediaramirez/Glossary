from models import Term, Alias
from models.term import db
from .parser_service import ParserService
from datetime import datetime

class TermService:
    @staticmethod
    def get_terms_paginated(page=1, per_page=20, search='', category=''):
        """Get paginated terms with optional search and category filter."""
        query = Term.query
        
        if search:
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
        
        return {
            'terms': [term.to_dict() for term in paginated.items],
            'total': paginated.total,
            'pages': paginated.pages,
            'current_page': page
        }
    
    @staticmethod
    def create_term(data):
        """Create a new term."""
        # Parse raw text if provided
        if 'raw_text' in data:
            parsed_data = ParserService.parse_glossary_input(data['raw_text'])
            if 'term' not in parsed_data or 'definition' not in parsed_data:
                raise ValueError('Invalid format. Must include Term and Definition.')
            parsed_data['main_term'] = parsed_data.pop('term')
            data = parsed_data
        
        # Validate required fields
        if not data.get('main_term') or not data.get('definition'):
            raise ValueError('Main term and definition are required.')
        
        # Check if term already exists
        existing_term = Term.query.filter_by(main_term=data['main_term']).first()
        if existing_term:
            raise ValueError(f'Term "{data["main_term"]}" already exists.')
        
        # Check if any alias already exists
        for alias_str in data.get('aliases', []):
            existing_alias = Alias.query.filter_by(alias=alias_str).first()
            if existing_alias:
                raise ValueError(f'Alias "{alias_str}" already exists for term "{existing_alias.term.main_term}".')
        
        # Create new term
        new_term = Term(
            main_term=data['main_term'],
            definition=data['definition'],
            category=data.get('category')
        )
        db.session.add(new_term)
        db.session.flush()
        
        # Add aliases
        for alias_str in data.get('aliases', []):
            new_alias = Alias(alias=alias_str, term_id=new_term.id)
            db.session.add(new_alias)
        
        db.session.commit()
        return new_term
    
    @staticmethod
    def update_term(term_id, data):
        """Update an existing term."""
        term = Term.query.get_or_404(term_id)
        
        # Update main fields
        if 'main_term' in data:
            existing = Term.query.filter(
                Term.main_term == data['main_term'],
                Term.id != term_id
            ).first()
            if existing:
                raise ValueError(f'Term "{data["main_term"]}" already exists.')
            term.main_term = data['main_term']
        
        if 'definition' in data:
            term.definition = data['definition']
        
        if 'category' in data:
            term.category = data.get('category')
        
        # Update aliases
        if 'aliases' in data:
            # Remove old aliases
            Alias.query.filter_by(term_id=term_id).delete()
            
            # Add new aliases
            for alias_str in data.get('aliases', []):
                if not alias_str:
                    continue
                
                existing_alias = Alias.query.join(Term).filter(
                    Alias.alias == alias_str,
                    Term.id != term_id
                ).first()
                if existing_alias:
                    raise ValueError(f'Alias "{alias_str}" already exists for term "{existing_alias.term.main_term}".')
                
                new_alias = Alias(alias=alias_str, term_id=term_id)
                db.session.add(new_alias)
        
        term.updated_at = datetime.utcnow()
        db.session.commit()
        return term
    
    @staticmethod
    def delete_term(term_id):
        """Delete a term."""
        term = Term.query.get_or_404(term_id)
        db.session.delete(term)
        db.session.commit()
        return True
    
    @staticmethod
    def get_categories():
        """Get all distinct categories."""
        categories = db.session.query(Term.category).distinct().filter(
            Term.category.isnot(None), 
            Term.category != ''
        ).all()
        return [cat[0] for cat in categories if cat[0]]
    
    @staticmethod
    def export_all_terms():
        """Export all terms."""
        terms = Term.query.all()
        return [
            {
                'main_term': term.main_term,
                'definition': term.definition,
                'category': term.category,
                'aliases': [alias.alias for alias in term.aliases]
            }
            for term in terms
        ]