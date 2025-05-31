from flask import request, jsonify
from services import TermService

class TermController:
    @staticmethod
    def get_terms():
        """Get paginated terms."""
        try:
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 20, type=int)
            search = request.args.get('search', '')
            category = request.args.get('category', '')
            
            result = TermService.get_terms_paginated(page, per_page, search, category)
            return jsonify(result), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @staticmethod
    def create_term():
        """Create a new term."""
        try:
            data = request.json
            term = TermService.create_term(data)
            
            return jsonify({
                'message': 'Term added successfully',
                'id': term.id,
                'main_term': term.main_term
            }), 201
            
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @staticmethod
    def update_term(term_id):
        """Update a term."""
        try:
            data = request.json
            TermService.update_term(term_id, data)
            return jsonify({'message': 'Term updated successfully'}), 200
            
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @staticmethod
    def delete_term(term_id):
        """Delete a term."""
        try:
            TermService.delete_term(term_id)
            return jsonify({'message': 'Term deleted successfully'}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @staticmethod
    def export_terms():
        """Export all terms."""
        try:
            export_data = TermService.export_all_terms()
            return jsonify(export_data), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500