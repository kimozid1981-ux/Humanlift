/**
 * Seeds jurisdiction configuration. Every country starts as NOT_RESEARCHED,
 * except France, where research started in the Milestone 0 audit.
 * Safe to run repeatedly: it never overwrites a country's status or sign-offs.
 */
import { PrismaClient, CountryAvailability } from '@prisma/client';

export const COUNTRIES: Array<{ code: string; name: string; languages: string[]; currencies: string[]; availability?: CountryAvailability }> = [
  { code: 'FR', name: 'France', languages: ['fr'], currencies: ['EUR'], availability: 'RESEARCH_IN_PROGRESS' },
  { code: 'BE', name: 'Belgium', languages: ['fr', 'nl', 'de'], currencies: ['EUR'] },
  { code: 'LU', name: 'Luxembourg', languages: ['fr', 'de'], currencies: ['EUR'] },
  { code: 'CH', name: 'Switzerland', languages: ['de', 'fr', 'it'], currencies: ['CHF'] },
  { code: 'DE', name: 'Germany', languages: ['de'], currencies: ['EUR'] },
  { code: 'ES', name: 'Spain', languages: ['es'], currencies: ['EUR'] },
  { code: 'PT', name: 'Portugal', languages: ['pt'], currencies: ['EUR'] },
  { code: 'IT', name: 'Italy', languages: ['it'], currencies: ['EUR'] },
  { code: 'NL', name: 'Netherlands', languages: ['nl'], currencies: ['EUR'] },
  { code: 'IE', name: 'Ireland', languages: ['en'], currencies: ['EUR'] },
  { code: 'GB', name: 'United Kingdom', languages: ['en'], currencies: ['GBP'] },
  { code: 'US', name: 'United States', languages: ['en', 'es'], currencies: ['USD'] },
  { code: 'CA', name: 'Canada', languages: ['en', 'fr'], currencies: ['CAD'] },
  { code: 'AU', name: 'Australia', languages: ['en'], currencies: ['AUD'] },
  { code: 'MA', name: 'Morocco', languages: ['ar', 'fr'], currencies: ['MAD'] },
];

export async function seedCountries(prisma: PrismaClient) {
  for (const c of COUNTRIES) {
    await prisma.country.upsert({
      where: { code: c.code },
      create: { code: c.code, name: c.name, languages: c.languages, currencies: c.currencies, availability: c.availability ?? 'NOT_RESEARCHED' },
      update: { name: c.name, languages: c.languages, currencies: c.currencies },
    });
  }
}

if (require.main === module) {
  const prisma = new PrismaClient();
  seedCountries(prisma)
    .then(() => console.log(`Seeded ${COUNTRIES.length} countries.`))
    .finally(() => prisma.$disconnect());
}
