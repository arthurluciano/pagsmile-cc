export type PaymentMethod = "CreditCard" | "DiscoverCard";
export type OrderCurrency = "BRL" | "HKD" | "JPY" | "USD" | "EUR" | "GBP";
export type IdentificationType = "CPF" | "CNPJ";
export type ThreeDSStatusCode = "U" | "N" | "Y" | "A" | "C" | "D" | "R" | "I";

export type TradeStatus =
  | "PROCESSING"
  | "SUCCESS"
  | "CANCEL"
  | "EXPIRED"
  | "REFUSED"
  | "CHARGEBACK"
  | "REFUNDED";

export type PaymentStep =
  | "idle"
  | "creating_order"
  | "awaiting_card_input"
  | "processing_3ds"
  | "processing_payment"
  | "polling_status"
  | "completed"
  | "failed";

export interface ThreeDSData {
  server_trans_id: string;
  version: string;
  cavv: string;
  status_code: ThreeDSStatusCode;
  eci: string;
  status: string;
  status_reason_code?: string;
  liability_shift: string;
  acs_trans_id?: string;
  ds_trans_id?: string;
}

export interface CustomerIdentification {
  type: IdentificationType;
  number: string;
}

export interface Customer {
  name: string;
  email: string;
  phone: string;
  identify: CustomerIdentification;
}

export interface Address {
  zip_code?: string;
  street?: string;
  street_number?: string;
  city?: string;
  state?: string;
}

export interface PaymentState {
  step: PaymentStep;
  prepayId: string | null;
  tradeNumber: string | null;
  outTradeNumber: string | null;
  status: TradeStatus | null;
  errorMessage: string | null;
  checkUrl: string | null;
}

export interface CreateOrderRequest {
  orderAmount: string;
  orderCurrency: OrderCurrency;
  subject: string;
  content: string;
  buyerId: string;
  customer?: Partial<Customer>;
  returnUrl?: string;
  timeoutExpress?: string;
}

export interface CreateOrderResponse {
  code: string;
  msg: string;
  trade_no: string;
  out_trade_no: string;
  web_url: string;
  prepay_id: string;
}

export interface PaymentResponse {
  code: string;
  msg: string;
  trade_no: string;
  out_trade_no: string;
  web_url: string;
  trade_status: TradeStatus;
  pay_url?: string;
  check_url?: string;
}

export interface QueryResponse {
  code: string;
  msg: string;
  trade_no: string;
  out_trade_no: string;
  trade_status: TradeStatus;
  order_currency: OrderCurrency;
  order_amount: string;
  refuse_detail?: string;
  create_time: string;
  update_time: string;
}
