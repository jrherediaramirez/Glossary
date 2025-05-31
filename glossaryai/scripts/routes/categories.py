from flask import Blueprint
from controllers import CategoryController

categories_bp = Blueprint('categories', __name__, url_prefix='/api')

@categories_bp.route('/categories', methods=['GET'])
def get_categories():
    return CategoryController.get_categories()

@categories_bp.route('/export', methods=['GET'])
def export_terms():
    from controllers import TermController
    return TermController.export_terms()