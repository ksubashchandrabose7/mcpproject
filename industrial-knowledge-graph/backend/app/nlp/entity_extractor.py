import re

INDUSTRIAL_PATTERNS = {
    'Machine': [
        r'\b(?:pump|motor|valve|compressor|turbine|generator|boiler|heat exchanger|reactor|vessel|tank|conveyor|agitator|centrifuge|filter|separator|dryer|furnace|heater|cooler|chiller)s?\b',
        r'\b[A-Z]{1,3}-\d{3,4}\b',  # P-101, M-201
    ],
    'Component': [
        r'\b(?:bearing|seal|gasket|impeller|shaft|coupling|gear|belt|piston|cylinder|nozzle|flange|pipe|tube|fitting|actuator|solenoid|diaphragm|rotor|stator|winding|bushing|O-ring)s?\b',
    ],
    'SubComponent': [
        r'\b(?:ball|roller|cage|race|inner ring|outer ring|seal lip|keyway|spline|blade|vane|disk|pin)s?\b',
    ],
    'Material': [
        r'\b(?:steel|stainless steel|titanium|bronze|brass|cast iron|aluminum|ceramic|rubber|viton|ptfe|teflon|carbon|alloy|polyurethane)s?\b',
    ],
    'ManufacturingMethod': [
        r'\b(?:casting|forging|machining|molding|extrusion|heat treatment|annealing|carburizing|grinding|welding|sintering|coating|surface hardening)\b',
    ],
    'OperatingLimit': [
        r'\b\d+(?:\.\d+)?\s*(?:°C|°F|K|bar|psi|kPa|MPa|rpm|RPM|Hz|kW|MW|kV|A|V|kg|ton|m³/h|L/min|m/s|mm/s|years|hrs|hours)\b',
        r'\b(?:maximum|max|limit|threshold|capacity|operating temperature|rotational speed|pressure rating|load rating|expected lifetime|operating life)\b',
    ],
    'FailureCondition': [
        r'\b(?:vibration|leakage|corrosion|erosion|cavitation|overheating|overload|short circuit|misalignment|imbalance|wear|crack|fracture|fatigue|failure|breakdown|malfunction|fault|defect|damage|contamination|stopped|tripped)s?\b',
    ],
    'Symptom': [
        r'\b(?:abnormal sound|noise|high temperature|smoke|fluid leak|unusual vibration|loss of pressure|power drop|trip signal|alarm|error code|warning)s?\b',
    ],
    'Cause': [
        r'\b(?:lubrication failure|lack of oil|misalignment|contamination|insufficient cooling|thermal stress|excessive load|bearing wear|seal degradation)s?\b',
    ],
    'Solution': [
        r'\b(?:re-lubricate|replace bearing|re-align shaft|replace seal|clean filter|adjust speed|tighten bolts|inspect impeller|cool down|reset trip)s?\b',
    ],
    'MaintenanceRequirement': [
        r'\b(?:inspection|maintenance|repair|replacement|overhaul|lubrication|calibration|alignment|balancing|cleaning|testing|commissioning|decommissioning|shutdown|startup|preventive maintenance|corrective maintenance)s?\b',
    ],
    'SafetyRequirement': [
        r'\b(?:lockout|tagout|LOTO|PPE|safety|hazard|risk|warning|caution|danger|emergency|evacuation|interlock|SOP|procedure|safety permit)s?\b',
    ],
}

def extract_entities(text: str) -> list[dict]:
    entities = []
    seen = set()

    for entity_type, patterns in INDUSTRIAL_PATTERNS.items():
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                entity_name = match.group(0).strip()
                key = entity_name.lower()
                if key and key not in seen and len(key) > 1:
                    seen.add(key)
                    entities.append({
                        'entity_name': entity_name.title() if len(entity_name) > 3 else entity_name.upper(),
                        'entity_type': entity_type,
                        'confidence': 0.90
                    })

    try:
        import spacy
        nlp = spacy.load("en_core_web_sm")
        doc = nlp(text)
        for ent in doc.ents:
            name = ent.text.strip()
            key = name.lower()
            if key and key not in seen and len(key) > 2:
                mapped_type = 'Location' if ent.label_ in ['GPE', 'LOC'] else ('Person' if ent.label_ == 'PERSON' else None)
                if mapped_type:
                    seen.add(key)
                    entities.append({
                        'entity_name': name.title(),
                        'entity_type': mapped_type,
                        'confidence': 0.75
                    })
    except (ImportError, OSError):
        pass

    return entities

