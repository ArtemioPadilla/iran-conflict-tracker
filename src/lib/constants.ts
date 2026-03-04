export const NAV_SECTIONS = [
  { id: 'sec-timeline', label: 'Timeline' },
  { id: 'sec-map', label: 'Map' },
  { id: 'sec-military', label: 'Military' },
  { id: 'sec-humanitarian', label: 'Humanitarian' },
  { id: 'sec-economic', label: 'Economic' },
  { id: 'sec-contested', label: 'Contested' },
  { id: 'sec-political', label: 'Political' },
] as const;

export const MIL_TABS = [
  { id: 'strikes', label: 'Strike Targets' },
  { id: 'retaliation', label: 'Iranian Retaliation' },
  { id: 'assets', label: 'US Assets Deployed' },
] as const;
