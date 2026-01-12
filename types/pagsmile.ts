export type PagsmileEnvironment = "sandbox" | "prod";
export type PagsmileRegion = "BRA" | "EUP" | "USA";

export interface PagsmileFieldConfig {
  id_selector: string;
}

export interface PagsmileFields {
  card_name: PagsmileFieldConfig;
  card_number: PagsmileFieldConfig;
  expiration_month: PagsmileFieldConfig;
  expiration_year: PagsmileFieldConfig;
  cvv: PagsmileFieldConfig;
}

export interface PagsmileConfig {
  app_id: string;
  public_key: string;
  env: PagsmileEnvironment;
  region_code: PagsmileRegion;
  prepay_id: string;
  fields: PagsmileFields;
  pre_auth?: boolean;
  form_id?: string;
}

export interface PagsmileCreateOrderParams {
  installments?: { stage: number };
  phone?: string;
  email?: string;
  postal_code?: string;
  payer_id?: string;
  address?: { country_code: string };
}

export interface PagsmileCreateOrderResponse {
  status: "success" | "error";
  query: boolean;
  message?: string;
}

export interface PagsmileClientInstance {
  createOrder: (params: PagsmileCreateOrderParams) => Promise<PagsmileCreateOrderResponse>;
}

export interface PagsmileGlobal {
  setPublishableKey: (config: PagsmileConfig) => Promise<PagsmileClientInstance>;
}

declare global {
  const Pagsmile: PagsmileGlobal;
}
