import { INITIAL_SCRAPER_SOURCES } from '../src/data/scraperSourcesData.ts';
import { INITIAL_GROUNDED_NEWS } from '../src/data/groundedNewsData.ts';
import {
  generateComplianceMaturityMatrix,
  generateCountryMaturitySummaries,
  MATURITY_SECTORS,
} from '../src/data/complianceMaturityData.ts';
import { REGULATORY_TIMELINE_EVENTS } from '../src/data/regulatoryTimelineData.ts';
import {
  ROADMAP_MILESTONES,
  ROADMAP_QUARTERS,
} from '../src/data/regulatoryRoadmapData.ts';
import fs from 'fs';
import path from 'path';

const OUT = path.resolve(import.meta.dirname, '..', 'data', 'regions', 'menat');
fs.mkdirSync(OUT, { recursive: true });

const write = (name: string, data: unknown) => {
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 2));
  console.log(`  wrote ${name}: ${Array.isArray(data) ? data.length + ' items' : 'object'}`);
};

write('scraper-sources.json', INITIAL_SCRAPER_SOURCES);
write('news-seed.json', INITIAL_GROUNDED_NEWS);
write('timeline.json', REGULATORY_TIMELINE_EVENTS);
write('roadmap-milestones.json', ROADMAP_MILESTONES);
write('roadmap-quarters.json', ROADMAP_QUARTERS);

// Maturity is computed by functions; snapshot the computed output so it can be
// served/edited as data. Store the matrix, sectors, and country summaries.
write('maturity.json', {
  sectors: MATURITY_SECTORS,
  matrix: generateComplianceMaturityMatrix(),
  countrySummaries: generateCountryMaturitySummaries(),
});

console.log('Phase 2 extraction complete ->', OUT);
