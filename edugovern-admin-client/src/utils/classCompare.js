export function normalizeClassForCompare(val) {
  if (val == null || val === '') return '';
  const v = String(val).trim();
  if (/^PreKG$/i.test(v)) return 'prekg';
  if (/^LKG$/i.test(v)) return 'lkg';
  if (/^UKG$/i.test(v)) return 'ukg';
  const numMatch = v.match(/^(\d+)/);
  if (numMatch) return numMatch[1];
  return v.toLowerCase();
}

export function isSameClass(a, b) {
  return normalizeClassForCompare(a) === normalizeClassForCompare(b);
}
