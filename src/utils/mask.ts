export const maskName = (name: string, shouldMask: boolean) => {
  if (!shouldMask || !name) return name;
  const parts = name.split(' ');
  return parts.map(p => p ? p[0] + '*'.repeat(Math.max(0, p.length - 1)) : '').join(' ');
};

export const maskEmail = (email: string, shouldMask: boolean) => {
  if (!shouldMask || !email) return email;
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const maskedLocal = local[0] + '*'.repeat(Math.max(0, local.length - 1));
  return `${maskedLocal}@${domain}`;
};

export const maskSalaryGap = (gap: number, shouldMask: boolean) => {
  if (!shouldMask) return `$${gap.toLocaleString()}`;
  return '+$X,XXX (Masked)';
};
