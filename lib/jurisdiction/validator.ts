export type Country = 'US' | 'IN';
export type USState = 'TX' | 'CA' | 'NY';
export type Confidence = 'explicit' | 'inferred' | 'unknown';

export interface JurisdictionInfo {
  country: Country;
  state?: USState | null;
  confidence: Confidence;
}

const US_STATES = ['TX', 'CA', 'NY'] as const;
const COUNTRIES = ['US', 'IN'] as const;

const STATE_PATTERNS = {
  TX: ['texas', 'tx', 'austin', 'houston', 'dallas'],
  CA: ['california', 'ca', 'los angeles', 'san francisco', 'silicon valley'],
  NY: ['new york', 'ny', 'nyc', 'manhattan', 'brooklyn'],
};

const COUNTRY_PATTERNS = {
  US: ['united states', 'usa', 'us', 'american', 'federal'],
  IN: ['india', 'indian', 'mumbai', 'delhi', 'bangalore', 'chennai'],
};

export function detectJurisdiction(text: string): JurisdictionInfo {
  const lowerText = text.toLowerCase();

  let country: Country | null = null;
  let state: USState | null = null;
  let confidence: Confidence = 'unknown';

  for (const [countryCode, patterns] of Object.entries(COUNTRY_PATTERNS)) {
    if (patterns.some(pattern => lowerText.includes(pattern))) {
      country = countryCode as Country;
      confidence = 'inferred';
      break;
    }
  }

  if (country === 'US') {
    for (const [stateCode, patterns] of Object.entries(STATE_PATTERNS)) {
      if (patterns.some(pattern => lowerText.includes(pattern))) {
        state = stateCode as USState;
        confidence = 'explicit';
        break;
      }
    }
  }

  if (lowerText.includes('jurisdiction:') || lowerText.includes('governed by')) {
    confidence = 'explicit';
  }

  return {
    country: country || 'US',
    state,
    confidence,
  };
}

export function validateJurisdiction(jurisdiction: Partial<JurisdictionInfo>): {
  valid: boolean;
  error?: string;
} {
  if (!jurisdiction.country) {
    return { valid: false, error: 'Country is required' };
  }

  if (!COUNTRIES.includes(jurisdiction.country)) {
    return { valid: false, error: `Invalid country: ${jurisdiction.country}` };
  }

  if (jurisdiction.state && !US_STATES.includes(jurisdiction.state as USState)) {
    return { valid: false, error: `Invalid US state: ${jurisdiction.state}` };
  }

  if (jurisdiction.state && jurisdiction.country !== 'US') {
    return { valid: false, error: 'State is only valid for US jurisdiction' };
  }

  return { valid: true };
}

export function formatJurisdiction(jurisdiction: JurisdictionInfo): string {
  if (jurisdiction.country === 'US' && jurisdiction.state) {
    return `${jurisdiction.state}, USA`;
  }
  return jurisdiction.country === 'US' ? 'USA (Federal)' : 'India (Central)';
}

export function getRAGPath(jurisdiction: JurisdictionInfo): string {
  if (jurisdiction.country === 'US') {
    return jurisdiction.state
      ? `/rag/us/state/${jurisdiction.state.toLowerCase()}`
      : '/rag/us/federal';
  }
  return '/rag/in/central';
}
