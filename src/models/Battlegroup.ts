export type BattlegroupAllegiance = 'loyalist' | 'traitor';

export interface Battlegroup {
  id: string;
  name: string;
  allegiance: BattlegroupAllegiance;
  createdAt: number;
  /** Order of reinforcement (unassigned) titan unit IDs for display. New/unlisted ids append at end. */
  reinforcementOrder?: string[];
}

