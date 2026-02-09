/**
 * Titan chassis scale order (smallest to largest) for display/sorting.
 * Unknown chassis sort to the end.
 */
const SCALE_ORDER: string[] = [
  'warhound',
  'dire-wolf',
  'reaver',
  'warbringer',
  'nemesis',
  'warlord',
  'warmaster',
];

function scaleRank(templateId: string): number {
  const i = SCALE_ORDER.indexOf(templateId.toLowerCase());
  return i >= 0 ? i : SCALE_ORDER.length;
}

/**
 * Sort unit IDs by titan scale (smallest first). Requires a function to resolve unit by id.
 */
export function sortUnitIdsByScale(
  unitIds: string[],
  getUnit: (id: string) => { templateId: string } | undefined
): string[] {
  return [...unitIds].sort((a, b) => {
    const ua = getUnit(a);
    const ub = getUnit(b);
    const ra = ua ? scaleRank(ua.templateId) : SCALE_ORDER.length;
    const rb = ub ? scaleRank(ub.templateId) : SCALE_ORDER.length;
    return ra - rb;
  });
}

/**
 * Sort titan templates by scale (smallest first). Use in "add titan" selection menus only.
 */
export function sortTemplatesByScale<T extends { id: string }>(templates: T[]): T[] {
  return [...templates].sort((a, b) => scaleRank(a.id) - scaleRank(b.id));
}
