import { z } from 'zod';

// ── Source tier (used in multiple places) ──
export const SourceSchema = z.object({
  name: z.string(),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  url: z.string().optional(),
});

// ── KPI items ──
export const KpiSchema = z.object({
  label: z.string(),
  value: z.string(),
  color: z.enum(['red', 'amber', 'blue', 'green']),
  source: z.string(),
  contested: z.boolean(),
  contestNote: z.string().optional(),
});

// ── Timeline ──
export const TimelineEventSchema = z.object({
  year: z.string(),
  title: z.string(),
  type: z.enum(['military', 'diplomatic', 'humanitarian', 'economic']),
  active: z.boolean().optional(),
  detail: z.string(),
  sources: z.array(SourceSchema),
});

export const TimelineEraSchema = z.object({
  era: z.string(),
  events: z.array(TimelineEventSchema),
});

// ── Map ──
export const MapPointSchema = z.object({
  id: z.string(),
  lon: z.number(),
  lat: z.number(),
  cat: z.enum(['strike', 'retaliation', 'asset', 'front']),
  label: z.string(),
  sub: z.string(),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});

export const MapLineSchema = z.object({
  from: z.tuple([z.number(), z.number()]),
  to: z.tuple([z.number(), z.number()]),
  cat: z.enum(['strike', 'retaliation', 'asset', 'front']),
  label: z.string(),
});

// ── Military strike items ──
export const StrikeItemSchema = z.object({
  name: z.string(),
  detail: z.string(),
  icon: z.enum(['target', 'retaliation', 'asset', 'casualty']),
  time: z.string(),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});

// ── Assets (no tier field) ──
export const AssetSchema = z.object({
  type: z.string(),
  name: z.string(),
  detail: z.string(),
});

// ── Casualties ──
export const CasualtyRowSchema = z.object({
  category: z.string(),
  killed: z.string(),
  injured: z.string(),
  source: z.string(),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal('all')]),
  contested: z.enum(['yes', 'no', 'evolving', 'heavily', 'partial']),
  note: z.string(),
});

// ── Economic ──
export const EconItemSchema = z.object({
  label: z.string(),
  value: z.string(),
  change: z.string(),
  direction: z.enum(['up', 'down']),
  sparkData: z.array(z.number()),
  color: z.string(),
  source: z.string(),
});

// ── Claims ──
export const ClaimSchema = z.object({
  question: z.string(),
  sideA: z.object({ label: z.string(), text: z.string() }),
  sideB: z.object({ label: z.string(), text: z.string() }),
  resolution: z.string(),
});

// ── Political ──
export const PolItemSchema = z.object({
  name: z.string(),
  role: z.string(),
  avatar: z.enum(['us', 'ir', 'il', 'un', 'other']),
  initial: z.string(),
  quote: z.string(),
});

// ── Meta ──
export const MetaSchema = z.object({
  operationName: z.string(),
  dayCount: z.number(),
  dateline: z.string(),
  heroHeadline: z.string(),
  heroSubtitle: z.string(),
  footerNote: z.string(),
  lastUpdated: z.string(),
});

// ── Inferred types ──
export type Source = z.infer<typeof SourceSchema>;
export type KpiItem = z.infer<typeof KpiSchema>;
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
export type TimelineEra = z.infer<typeof TimelineEraSchema>;
export type MapPoint = z.infer<typeof MapPointSchema>;
export type MapLine = z.infer<typeof MapLineSchema>;
export type StrikeItem = z.infer<typeof StrikeItemSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type CasualtyRow = z.infer<typeof CasualtyRowSchema>;
export type EconItem = z.infer<typeof EconItemSchema>;
export type Claim = z.infer<typeof ClaimSchema>;
export type PolItem = z.infer<typeof PolItemSchema>;
export type Meta = z.infer<typeof MetaSchema>;
