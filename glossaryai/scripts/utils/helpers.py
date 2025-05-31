def validate_term_data(data):
    """Validate term data."""
    if not data.get('main_term') or not data.get('definition'):
        return False, 'Main term and definition are required.'
    return True, None

def format_aliases(aliases):
    """Format aliases from string or list."""
    if isinstance(aliases, str):
        return [a.strip() for a in aliases.split(',') if a.strip()]
    elif isinstance(aliases, list):
        return [a.strip() for a in aliases if a.strip()]
    else:
        return []