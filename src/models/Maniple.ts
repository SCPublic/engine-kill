export interface Maniple {
  id: string;
  name: string;
  templateId: string; // Reference to ManipleTemplate.id
  battlegroupId?: string | null; // which battlegroup this maniple belongs to
  legionId?: string | null; // BattleScribe legion selection entry id (if any)
  playerId: string;
  isLocal: boolean; // true if stored locally, false if synced (future)
  titanUnitIds: string[]; // Unit.id list (titan units) in this maniple
  createdAt: number;
}


