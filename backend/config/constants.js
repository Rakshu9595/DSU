export const POWER_RATING_SOURCES = {
  USER_ENTERED: 'user_entered',
  MANUFACTURER_SPECIFICATION: 'manufacturer_specification',
  REFERENCE_ESTIMATE: 'reference_estimate',
  UNKNOWN: 'unknown'
};

export const DEVICE_CATEGORIES = {
  COOLING: 'cooling',
  ENTERTAINMENT: 'entertainment',
  COMPUTING: 'computing',
  KITCHEN: 'kitchen',
  COOKING: 'cooking',
  LIGHTING: 'lighting',
  UTILITY: 'utility',
  HEATING: 'heating',
  CLEANING: 'cleaning',
  REFRIGERATION: 'refrigeration',
  OTHER: 'other',
  ELECTRICAL_FITTINGS: 'electrical_fittings'
};

export const FITTING_TYPES = {
  SWITCH: 'switch',
  SOCKET: 'socket',
  OTHER: 'other'
};

export const SWITCH_STATES = {
  ON: 'on',
  OFF: 'off',
  UNKNOWN: 'unknown'
};

export const ANALYSIS_STATUS = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

export const DEFAULT_TARIFF_INR = 8.0;
export const DEFAULT_EMISSION_FACTOR = 0.82; // kg CO2e / kWh (CEA India default)

export const SAFETY_LIMITS = {
  MIN_POWER_WATTS: 1,
  MAX_POWER_WATTS: 25000,
  MIN_DAILY_HOURS: 0.05,
  MAX_DAILY_HOURS: 24,
  MIN_DAYS_PER_MONTH: 1,
  MAX_DAYS_PER_MONTH: 31,
  MIN_TARIFF: 0.01,
  MAX_TARIFF: 500.0,
  MAX_VIDEO_SIZE_MB: 500
};

export const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mov', '.mkv', '.webm'];
export const ALLOWED_MIME_TYPES = [
  'video/mp4',
  'video/x-matroska',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm'
];
