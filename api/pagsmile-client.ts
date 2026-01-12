import { PAGSMILE_ENDPOINTS } from "../constants/pagsmile";
import type { PagsmileEnvironment } from "../types/pagsmile";
import type {
  CreateOrderResponse,
  PaymentResponse,
  QueryResponse,
  PaymentMethod,
  OrderCurrency,
  Customer,
  Address,
  ThreeDSData,
} from "../types/payment";
import { formatPagsmileTimestamp } from "../utils/timestamp";

interface PagsmileClientConfig {
  appId: string;
  securityKey: string;
  env: PagsmileEnvironment;
  notifyUrl: string;
  returnUrl?: string;
}

interface DeviceInfo {
  userAgent: string;
  ipAddress: string;
}

const createAuthHeader = (appId: string, securityKey: string): string => {
  const credentials = `${appId}:${securityKey}`;
  const encoded = btoa(credentials);
  return `Basic ${encoded}`;
};

export const createPagsmileClient = (config: PagsmileClientConfig) => {
  const { appId, securityKey, env, notifyUrl, returnUrl } = config;
  const endpoints = PAGSMILE_ENDPOINTS[env];
  const authHeader = createAuthHeader(appId, securityKey);

  const headers = {
    "Content-Type": "application/json; charset=UTF-8",
    Authorization: authHeader,
  };

  const createOrder = async (params: {
    outTradeNo: string;
    method: PaymentMethod;
    orderAmount: string;
    orderCurrency: OrderCurrency;
    subject: string;
    content: string;
    buyerId: string;
    customer: Customer;
    address?: Address;
    deviceInfo?: DeviceInfo;
    timeoutExpress?: string;
  }): Promise<CreateOrderResponse> => {
    const body = {
      app_id: appId,
      out_trade_no: params.outTradeNo,
      method: params.method,
      order_amount: params.orderAmount,
      order_currency: params.orderCurrency,
      subject: params.subject,
      content: params.content,
      trade_type: "API",
      timestamp: formatPagsmileTimestamp(),
      notify_url: notifyUrl,
      return_url: returnUrl,
      timeout_express: params.timeoutExpress ?? "1d",
      version: "2.0",
      buyer_id: params.buyerId,
      customer: {
        identify: params.customer.identify,
        name: params.customer.name,
        email: params.customer.email,
        phone: params.customer.phone,
      },
      address: params.address,
      device_info: params.deviceInfo
        ? {
            user_agent: params.deviceInfo.userAgent,
            ip_address: params.deviceInfo.ipAddress,
          }
        : undefined,
    };

    const response = await fetch(`${endpoints.gateway}/trade/create`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    return response.json() as Promise<CreateOrderResponse>;
  };

  const processPayment = async (params: {
    outTradeNo: string;
    method: PaymentMethod;
    orderAmount: string;
    orderCurrency: OrderCurrency;
    subject: string;
    content: string;
    buyerId: string;
    token: string;
    userIp: string;
    customer?: Customer;
    address?: Address;
    installments?: string;
    threeds?: ThreeDSData;
    deviceUserAgent?: string;
    websiteUrl?: string;
    region?: string;
  }): Promise<PaymentResponse> => {
    const body = {
      app_id: appId,
      method: params.method,
      out_trade_no: params.outTradeNo,
      notify_url: notifyUrl,
      return_url: returnUrl,
      timestamp: formatPagsmileTimestamp(),
      subject: params.subject,
      content: params.content,
      order_amount: params.orderAmount,
      order_currency: params.orderCurrency,
      buyer_id: params.buyerId,
      token: params.token,
      user_ip: params.userIp,
      customer: params.customer,
      address: params.address,
      installments: params.installments,
      threeds: params.threeds,
      device: params.deviceUserAgent ? { user_agent: params.deviceUserAgent } : undefined,
      website_url: params.websiteUrl,
      region: params.region,
    };

    const response = await fetch(`${endpoints.gateway}/trade/pay`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    return response.json() as Promise<PaymentResponse>;
  };

  const queryPayment = async (params: {
    outTradeNo?: string;
    tradeNo?: string;
  }): Promise<QueryResponse> => {
    const body = {
      app_id: appId,
      timestamp: formatPagsmileTimestamp(),
      out_trade_no: params.outTradeNo,
      trade_no: params.tradeNo,
    };

    const response = await fetch(`${endpoints.gateway}/trade/query`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    return response.json() as Promise<QueryResponse>;
  };

  return {
    createOrder,
    processPayment,
    queryPayment,
  };
};

export type PagsmileClient = ReturnType<typeof createPagsmileClient>;
