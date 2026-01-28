export interface PrincepsTraitTemplate {
  id: string;
  name: string;
  rules: string[];
  legioCategoryId?: string | null; // optional: restrict to legion
  allegiance?: 'loyalist' | 'traitor' | 'unknown';
  traitGroup?: 'standard' | 'legio' | 'corrupted' | 'unknown';
}

