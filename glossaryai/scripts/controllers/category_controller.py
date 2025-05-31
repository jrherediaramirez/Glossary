from flask import jsonify
from services import TermService

class CategoryController:
    @staticmethod
    def get_categories():
        """Get all categories."""
        try:
            categories = TermService.get_categories()
            return jsonify(categories), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500