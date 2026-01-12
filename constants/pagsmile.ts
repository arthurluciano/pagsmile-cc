export const PAGSMILE_ENDPOINTS = {
  sandbox: {
    gateway: "https://gateway-test.pagsmile.com",
    security: "https://security-test.pagsmile.com",
  },
  prod: {
    gateway: "https://gateway.pagsmile.com",
    security: "https://security.pagsmile.com",
  },
} as const;

export const PAGSMILE_ERROR_CODES = {
  "10000": null,
  "40002": "Business operation failed",
  "40004": "Invalid request parameters",
  "40005": "Authentication failed",
  "40006": "Duplicate transaction",
} as const;

export type PagsmileErrorCode = keyof typeof PAGSMILE_ERROR_CODES;

export const getErrorMessage = (code: string, subMsg?: string): string => {
  const baseMessage = PAGSMILE_ERROR_CODES[code as PagsmileErrorCode];
  if (baseMessage === null) return "";
  if (!baseMessage) return subMsg ?? "An unexpected error occurred";
  return subMsg ? `${baseMessage}: ${subMsg}` : baseMessage;
};

export const TERMINAL_STATUSES = [
  "SUCCESS",
  "CANCEL",
  "EXPIRED",
  "REFUSED",
  "CHARGEBACK",
  "REFUNDED",
] as const;

export const isTerminalStatus = (status: string): boolean =>
  TERMINAL_STATUSES.includes(status as (typeof TERMINAL_STATUSES)[number]);
