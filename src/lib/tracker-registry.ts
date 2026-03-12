import { TrackerConfigSchema, type TrackerConfig } from './tracker-config';

// Eagerly load all tracker.json files at build time
const trackerModules = import.meta.glob<{ default: unknown }>(
  '../../trackers/*/tracker.json',
  { eager: true },
);

let _cache: TrackerConfig[] | null = null;

/** Load and validate all tracker configs. Results are cached. */
export function loadAllTrackers(): TrackerConfig[] {
  if (_cache) return _cache;

  const configs: TrackerConfig[] = [];
  for (const [path, mod] of Object.entries(trackerModules)) {
    const raw = 'default' in mod ? mod.default : mod;
    try {
      configs.push(TrackerConfigSchema.parse(raw));
    } catch (err) {
      const slug = path.match(/trackers\/([^/]+)\//)?.[1] ?? path;
      console.error(`Invalid tracker config for "${slug}":`, err);
    }
  }

  // Sort: active first, then archived, then draft; alphabetical within group
  const order = { active: 0, archived: 1, draft: 2 };
  configs.sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name));

  _cache = configs;
  return configs;
}

/** Load a single tracker config by slug. */
export function loadTrackerConfig(slug: string): TrackerConfig | undefined {
  return loadAllTrackers().find((t) => t.slug === slug);
}

/** Get all active tracker slugs (for getStaticPaths). */
export function getTrackerSlugs(): string[] {
  return loadAllTrackers()
    .filter((t) => t.status !== 'draft')
    .map((t) => t.slug);
}
