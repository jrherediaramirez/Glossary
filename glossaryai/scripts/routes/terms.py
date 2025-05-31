from flask import Blueprint
from controllers import TermController

terms_bp = Blueprint('terms', __name__, url_prefix='/api/terms')

@terms_bp.route('', methods=['GET'])
def get_terms():
    return TermController.get_terms()

@terms_bp.route('', methods=['POST'])
def create_term():
    return TermController.create_term()

@terms_bp.route('/<int:term_id>', methods=['PUT'])
def update_term(term_id):
    return TermController.update_term(term_id)

@terms_bp.route('/<int:term_id>', methods=['DELETE'])
def delete_term(term_id):
    return TermController.delete_term(term_id)