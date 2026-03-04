export function tierClass(t: number | string): string {
  return t === 1 ? 't1' : t === 2 ? 't2' : t === 3 ? 't3' : t === 'all' ? 't3' : 't4';
}

export function tierLabel(t: number | string): string {
  return t === 1
    ? 'Official'
    : t === 2
      ? 'Major'
      : t === 3
        ? 'Institutional'
        : t === 'all'
          ? 'All tiers'
          : 'Unverified';
}

export function contestedBadge(c: string): { text: string; className: string } {
  if (c === 'no') return { text: 'Verified', className: 'contested-no' };
  if (c === 'evolving') return { text: 'Evolving', className: 'contested-evolving' };
  if (c === 'heavily') return { text: 'Heavily Contested', className: 'contested-yes' };
  if (c === 'partial') return { text: 'Partial', className: 'contested-evolving' };
  return { text: 'Contested', className: 'contested-yes' };
}
