export interface LegionTemplate {
  id: string;
  name: string;
  rules: string[]; // formatted human-readable rule lines
  categoryKey?: string | null; // e.g. "LegioMortis"
  categoryId?: string | null; // BattleScribe categoryEntry id
}

