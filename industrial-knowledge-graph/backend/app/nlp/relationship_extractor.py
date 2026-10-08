import re

def extract_relationships(text: str, entities: list[dict]) -> list[dict]:
    relationships = []
    sentences = re.split(r'[.!?\n]+', text)

    patterns = {
        'HAS_COMPONENT': [r'contains', r'has component', r'consists of', r'uses', r'equipped with', r'built with', r'part of'],
        'MADE_OF': [r'made of', r'manufactured from', r'composed of', r'constructed of', r'material used is', r'material:'],
        'MAX_TEMPERATURE': [r'heat resistance', r'maximum temperature', r'max temp', r'withstands up to', r'temperature limit', r'temperature rating'],
        'MAX_SPEED': [r'maximum rotational speed', r'max speed', r'max rpm', r'rated speed', r'speed limit'],
        'EXPECTED_LIFETIME': [r'expected operating life', r'expected lifetime', r'service life', r'design life'],
        'MANUFACTURING_METHOD': [r'manufactured using', r'produced by', r'fabricated via', r'machined by'],
        'CAUSED_BY': [r'caused by', r'due to', r'result of', r'triggered by', r'leads to'],
        'SYMPTOM_OF': [r'symptom of', r'indicates', r'sign of', r'manifested as'],
        'SOLVED_BY': [r'solved by', r'corrected by', r'repaired by', r'maintenance procedure', r'corrective action'],
        'REQUIRES_MAINTENANCE': [r'requires maintenance', r'maintenance interval', r'lubrication interval'],
        'SAFETY_REQUIREMENT': [r'safety procedure', r'lockout', r'ppe required', r'hazard warning']
    }

    for sentence in sentences:
        sent_lower = sentence.lower()
        sentence_entities = [ent for ent in entities if ent['entity_name'].lower() in sent_lower]
        
        for i in range(len(sentence_entities)):
            for j in range(i + 1, len(sentence_entities)):
                entA = sentence_entities[i]
                entB = sentence_entities[j]
                
                posA = sent_lower.find(entA['entity_name'].lower())
                posB = sent_lower.find(entB['entity_name'].lower())
                
                if posA == -1 or posB == -1: 
                    continue
                
                start = min(posA + len(entA['entity_name']), posB + len(entB['entity_name']))
                end = max(posA, posB)
                middle_text = sent_lower[start:end]

                rel_type = None

                for r_type, p_list in patterns.items():
                    if any(p in middle_text for p in p_list):
                        rel_type = r_type
                        break
                
                if not rel_type:
                    types = {entA['entity_type'], entB['entity_type']}
                    if types == {'Machine', 'Component'} or types == {'Component', 'SubComponent'}:
                        rel_type = 'HAS_COMPONENT'
                    elif types == {'Component', 'Material'}:
                        rel_type = 'MADE_OF'
                    elif types == {'Component', 'OperatingLimit'}:
                        rel_type = 'HAS_SPECIFICATION'
                    elif types == {'FailureCondition', 'Cause'}:
                        rel_type = 'CAUSED_BY'
                    elif types == {'FailureCondition', 'Solution'}:
                        rel_type = 'SOLVED_BY'

                if rel_type:
                    source = entA['entity_name']
                    target = entB['entity_name']
                    
                    if posA > posB and rel_type in ['HAS_COMPONENT', 'MADE_OF', 'HAS_SPECIFICATION']:
                        source, target = target, source

                    rel = {
                        'source_entity': source,
                        'target_entity': target,
                        'relationship_type': rel_type,
                        'confidence': 0.85
                    }
                    if rel not in relationships:
                        relationships.append(rel)

    return relationships

