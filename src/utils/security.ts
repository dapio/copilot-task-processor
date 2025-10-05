// Utility functions for security and validation

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (input: string): string => {
  const element = document.createElement('div');
  element.innerText = input;
  return element.innerHTML;
};

/**
 * Sanitize URL to prevent malicious redirects
 */
export const sanitizeUrl = (url: string): string => {
  try {
    const urlObject = new URL(url);

    // Allow only https and http protocols
    if (!['http:', 'https:'].includes(urlObject.protocol)) {
      return '#';
    }

    return urlObject.toString();
  } catch {
    return '#';
  }
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    const urlObject = new URL(url);
    return ['http:', 'https:'].includes(urlObject.protocol);
  } catch {
    return false;
  }
};

/**
 * Validate GitHub repository URL
 */
export const isValidGitHubUrl = (url: string): boolean => {
  const githubRegex = /^https:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+$/;
  return githubRegex.test(url);
};

/**
 * Validate BitBucket repository URL
 */
export const isValidBitBucketUrl = (url: string): boolean => {
  const bitbucketRegex = /^https:\/\/bitbucket\.org\/[\w\-\.]+\/[\w\-\.]+$/;
  return bitbucketRegex.test(url);
};

/**
 * Validate Azure DevOps repository URL
 */
export const isValidAzureReposUrl = (url: string): boolean => {
  const azureRegex = /^https:\/\/dev\.azure\.com\/[\w\-\.]+\/[\w\-\.]+$/;
  return azureRegex.test(url);
};

/**
 * Validate GitLab repository URL
 */
export const isValidGitLabUrl = (url: string): boolean => {
  const gitlabRegex = /^https:\/\/gitlab\.com\/[\w\-\.]+\/[\w\-\.]+$/;
  return gitlabRegex.test(url);
};

/**
 * Validate project name
 */
export const isValidProjectName = (name: string): boolean => {
  return name.length >= 2 && name.length <= 100 && /^[\w\s\-\.]+$/.test(name);
};

/**
 * Validate branch name
 */
export const isValidBranchName = (branch: string): boolean => {
  return (
    branch.length >= 1 && branch.length <= 100 && /^[\w\-\/\.]+$/.test(branch)
  );
};

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  constructor(
    private maxAttempts: number = 5,
    private timeWindow: number = 60000 // 1 minute
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Remove old attempts outside time window
    const validAttempts = attempts.filter(time => now - time < this.timeWindow);

    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }

    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return true;
  }

  getRemainingAttempts(key: string): number {
    const attempts = this.attempts.get(key) || [];
    const now = Date.now();
    const validAttempts = attempts.filter(time => now - time < this.timeWindow);
    return Math.max(0, this.maxAttempts - validAttempts.length);
  }

  getResetTime(key: string): number {
    const attempts = this.attempts.get(key) || [];
    if (attempts.length === 0) return 0;

    const oldestAttempt = Math.min(...attempts);
    return oldestAttempt + this.timeWindow;
  }
}

/**
 * CSRF Token utility (simulation)
 */
export class CSRFProtection {
  private static token: string | null = null;

  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    this.token = Array.from(array, byte =>
      byte.toString(16).padStart(2, '0')
    ).join('');
    return this.token;
  }

  static getToken(): string {
    if (!this.token) {
      return this.generateToken();
    }
    return this.token;
  }

  static validateToken(token: string): boolean {
    return this.token === token;
  }
}

/**
 * Input sanitization for preventing injection attacks
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
};

/**
 * Validate and sanitize form data
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedData: Record<string, any>;
}

export const validateFormData = (
  data: Record<string, any>,
  rules: Record<string, (value: any) => string | null>
): ValidationResult => {
  const errors: Record<string, string> = {};
  const sanitizedData: Record<string, any> = {};

  Object.entries(data).forEach(([field, value]) => {
    // Sanitize string inputs
    const sanitizedValue =
      typeof value === 'string' ? sanitizeInput(value) : value;
    sanitizedData[field] = sanitizedValue;

    // Apply validation rule
    if (rules[field]) {
      const error = rules[field](sanitizedValue);
      if (error) {
        errors[field] = error;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData,
  };
};

/**
 * Debounce function for preventing excessive API calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function for rate limiting
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Safe JSON parse with error handling
 */
export const safeJsonParse = <T = any>(json: string, defaultValue: T): T => {
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
};

/**
 * Generate secure random ID
 */
export const generateSecureId = (length: number = 16): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Check if user input is potentially malicious
 */
export const containsMaliciousContent = (input: string): boolean => {
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /eval\(/i,
    /expression\(/i,
    /vbscript:/i,
    /data:text\/html/i,
  ];

  return maliciousPatterns.some(pattern => pattern.test(input));
};

/**
 * Secure local storage wrapper
 */
export class SecureStorage {
  private static prefix = 'thinkcode_';

  static set(key: string, value: any): void {
    try {
      const serializedValue = JSON.stringify({
        data: value,
        timestamp: Date.now(),
        checksum: this.generateChecksum(JSON.stringify(value)),
      });
      localStorage.setItem(this.prefix + key, serializedValue);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  static get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return defaultValue;

      const parsed = JSON.parse(item);
      const expectedChecksum = this.generateChecksum(
        JSON.stringify(parsed.data)
      );

      // Verify data integrity
      if (parsed.checksum !== expectedChecksum) {
        console.warn('Data integrity check failed for key:', key);
        return defaultValue;
      }

      return parsed.data;
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return defaultValue;
    }
  }

  static remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  static clear(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }

  private static generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }
}

export default {
  sanitizeHtml,
  sanitizeUrl,
  isValidEmail,
  isValidUrl,
  isValidGitHubUrl,
  isValidBitBucketUrl,
  isValidAzureReposUrl,
  isValidGitLabUrl,
  isValidProjectName,
  isValidBranchName,
  sanitizeInput,
  validateFormData,
  debounce,
  throttle,
  safeJsonParse,
  generateSecureId,
  containsMaliciousContent,
  RateLimiter,
  CSRFProtection,
  SecureStorage,
};
