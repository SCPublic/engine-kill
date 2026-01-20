import { ManipleTemplate } from '../models/ManipleTemplate';

/**
 * Starter data (placeholder / WIP):
 * These are NOT intended to be perfectly rules-accurate yet—just scaffolding so we can build UX and persistence.
 */
export const manipleTemplates: ManipleTemplate[] = [
  {
    id: 'axiom',
    name: 'Axiom Maniple',
    allowedTitanTemplateIds: ['warlord', 'reaver', 'warhound'],
    minTitans: 2,
    maxTitans: 5,
    specialRule: 'Axiom: (placeholder) Gains a coordinated fire special rule.',
  },
  {
    id: 'lupercal',
    name: 'Lupercal Light Maniple',
    allowedTitanTemplateIds: ['warhound', 'reaver'],
    minTitans: 2,
    maxTitans: 4,
    specialRule: 'Lupercal: (placeholder) Gains a flanking/pack hunting special rule.',
  },
];


