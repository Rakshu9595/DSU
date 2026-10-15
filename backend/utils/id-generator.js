import crypto from 'crypto';

export function generateId(prefix = '') {
  const random = crypto.randomBytes(6).toString('hex');
  return prefix ? `${prefix}_${random}` : random;
}
