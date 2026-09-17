export interface PasswordCriteria {
  hasMinLength: boolean;
  hasLower: boolean;
  hasUpper: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export interface PasswordEvaluationResult {
  criteria: PasswordCriteria;
  score: number; // 0 to 4
  label: 'Empty' | 'Weak' | 'Fair' | 'Good' | 'Strong';
}

export function evaluatePasswordCriteria(password: string): PasswordCriteria {
  return {
    hasMinLength: password.length >= 8,
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
}

export function evaluatePasswordStrength(password: string): PasswordEvaluationResult {
  const criteria = evaluatePasswordCriteria(password);

  if (!password) {
    return {
      criteria,
      score: 0,
      label: 'Empty',
    };
  }

  let count = 0;
  if (criteria.hasMinLength) count++;
  if (criteria.hasLower) count++;
  if (criteria.hasUpper) count++;
  if (criteria.hasNumber) count++;
  if (criteria.hasSpecial) count++;

  if (count <= 2) {
    return { criteria, score: 1, label: 'Weak' };
  }
  if (count === 3) {
    return { criteria, score: 2, label: 'Fair' };
  }
  if (count === 4) {
    return { criteria, score: 3, label: 'Good' };
  }
  return { criteria, score: 4, label: 'Strong' };
}
