const PALETTE = [
  { bg: '#DCFCE7', text: '#15803d' },
  { bg: '#FEF3C7', text: '#b45309' },
  { bg: '#FCE7F3', text: '#be185d' },
  { bg: '#E0E7FF', text: '#4338ca' },
  { bg: '#DBEAFE', text: '#1d4ed8' },
  { bg: '#FFE4E6', text: '#be123c' },
];

export function categoryColor(index: number) {
  return PALETTE[index % PALETTE.length];
}
