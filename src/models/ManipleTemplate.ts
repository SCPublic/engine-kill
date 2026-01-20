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
}


