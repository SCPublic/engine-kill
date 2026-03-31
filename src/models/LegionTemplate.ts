export interface LegionTemplate {
  id: string;
  name: string;
  rules: string[]; // formatted human-readable rule lines
  categoryKey?: string | null; // e.g. "LegioMortis"
  categoryId?: string | null; // BattleScribe categoryEntry id
  /** BS `selectionEntry` id for the Legio force upgrade; matches `princepsTraits[].legioCategoryId` for trait tables. */
  princepsLegioSelectionEntryId?: string | null;
  allegiance?: 'loyalist' | 'traitor' | 'unknown';
}

