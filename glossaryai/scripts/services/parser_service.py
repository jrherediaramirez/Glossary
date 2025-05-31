class ParserService:
    @staticmethod
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
                    parts = line.split(':', 1)
                    if len(parts) == 2:
                        key, value = parts
                        key = key.strip().lower()
                        value = value.strip()
                        
                        if key in ['term', 'aliases', 'category', 'definition']:
                            data[key] = value
                            current_key = key if key == 'definition' else None
                        else:
                            if current_key == 'definition':
                                data['definition'] = data.get('definition', '') + '\n' + line.strip()
                    elif current_key == 'definition':
                        data['definition'] = data.get('definition', '') + '\n' + line.strip()
                elif current_key == 'definition':
                    data['definition'] = data.get('definition', '') + '\n' + line.strip()
        
        # Post-process definition
        if 'definition' in data:
            data['definition'] = data['definition'].strip()

        # Parse aliases
        if 'aliases' in data:
            data['aliases'] = [a.strip() for a in data['aliases'].split(',') if a.strip()]
        else:
            data['aliases'] = []
        
        return data