export interface Maniple {
  id: string;
  name: string;
  templateId: string; // Reference to ManipleTemplate.id
  playerId: string;
  isLocal: boolean; // true if stored locally, false if synced (future)
  titanUnitIds: string[]; // Unit.id list (titan units) in this maniple
  createdAt: number;
}


