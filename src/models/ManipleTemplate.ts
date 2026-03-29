export type ManipleAllegiance = 'loyalist' | 'traitor' | 'unknown';

export interface ManipleTemplate {
  id: string;
  name: string;
  /**
   * Titan template IDs allowed in this maniple (matches Unit.templateId for titan units).
   * This is a lightweight rules constraint for now; we can extend later with required slots, limits per chassis, etc.
   */
  allowedTitanTemplateIds: string[];
  minTitans: number;
  maxTitans: number;
  specialRule: string;
  description?: string;
  /**
   * Optional metadata only. BattleScribe often encodes which book an entry came from here — that is not the same
   * as “this maniple is only legal for loyalist/traitor battlegroups”; in AT, almost all core maniples are
   * available to both sides. Prefer describing legio-only rules in `specialRule` until we add a dedicated field.
   */
  allegiance?: ManipleAllegiance;
}


