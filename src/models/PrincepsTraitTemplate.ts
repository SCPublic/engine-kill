export interface PrincepsTraitTemplate {
  id: string;
  name: string;
  rules: string[];
  legioCategoryId?: string | null; // optional: restrict to legion
}

