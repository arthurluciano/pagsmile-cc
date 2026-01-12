import index from "./index.html";
import { createPagsmileClient } from "./api/pagsmile-client";
import { generateTradeNo } from "./utils/generate-trade-no";
import { getErrorMessage, isTerminalStatus } from "./constants/pagsmile";
import type { PagsmileEnvironment } from "./types/pagsmile";
import type {
  CreateOrderRequest,
  OrderCurrency,
  PaymentMethod,
} from "./types/payment";

const PAGSMILE_APP_ID = Bun.env.PAGSMILE_APP_ID ?? "";
const PAGSMILE_SECURITY_KEY = Bun.env.PAGSMILE_SECURITY_KEY ?? "";
const PAGSMILE_PUBLIC_KEY = Bun.env.PAGSMILE_PUBLIC_KEY ?? "";
const PAGSMILE_ENV = (Bun.env.PAGSMILE_ENV ?? "sandbox") as PagsmileEnvironment;
const BASE_URL = Bun.env.BASE_URL ?? "http://localhost:3000";

const log = {
  info: (message: string, data?: unknown) => {
    console.log(`[${new Date().toISOString()}] INFO: ${message}`, data ?? "");
  },
  error: (message: string, error?: unknown) => {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error ?? "");
  },
  warn: (message: string, data?: unknown) => {
    console.warn(`[${new Date().toISOString()}] WARN: ${message}`, data ?? "");
  },
};

const pagsmileClient = createPagsmileClient({
  appId: PAGSMILE_APP_ID,
  securityKey: PAGSMILE_SECURITY_KEY,
  env: PAGSMILE_ENV,
  notifyUrl: `${BASE_URL}/api/webhooks/pagsmile`,
});

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const errorResponse = (message: string, status = 400) =>
  jsonResponse({ error: message }, status);

const getClientIp = (request: Request): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0];
    return firstIp?.trim() ?? "127.0.0.1";
  }
  return "127.0.0.1";
};

Bun.serve({
  port: Bun.env.PORT ?? 3000,
  routes: {
    "/": index,

    "/api/config": {
      GET: () => {
        log.info("GET /api/config");
        return jsonResponse({
          appId: PAGSMILE_APP_ID,
          publicKey: PAGSMILE_PUBLIC_KEY,
          env: PAGSMILE_ENV,
          regionCode: "BRA",
        });
      },
    },

    "/api/orders": {
      POST: async (request) => {
        const outTradeNo = generateTradeNo();
        log.info("POST /api/orders", { outTradeNo });

        let body: CreateOrderRequest;
        try {
          body = (await request.json()) as CreateOrderRequest;
        } catch (error) {
          log.error("Failed to parse request body", error);
          return errorResponse("Invalid request body", 400);
        }

        try {
          const result = await pagsmileClient.createOrder({
            outTradeNo,
            orderAmount: body.orderAmount,
            orderCurrency: body.orderCurrency,
            subject: body.subject,
            content: body.content,
            buyerId: body.buyerId,
            returnUrl: body.returnUrl,
            customer: body.customer,
            timeoutExpress: body.timeoutExpress,
          });

          if (result.code !== "10000") {
            log.error("Pagsmile createOrder failed", {
              outTradeNo,
              code: result.code,
              msg: result.msg,
            });
            return errorResponse(getErrorMessage(result.code, result.msg));
          }

          log.info("Order created successfully", {
            outTradeNo,
            tradeNo: result.trade_no,
            prepayId: result.prepay_id,
          });

          return jsonResponse({
            tradeNo: result.trade_no,
            outTradeNo: result.out_trade_no,
            prepayId: result.prepay_id,
            webUrl: result.web_url,
          });
        } catch (error) {
          log.error("Failed to create order", { outTradeNo, error });
          return errorResponse("Failed to create order", 500);
        }
      },
    },

    "/api/payments": {
      POST: async (request) => {
        log.info("POST /api/payments");

        let body: {
          outTradeNo: string;
          method: PaymentMethod;
          orderAmount: string;
          orderCurrency: OrderCurrency;
          subject: string;
          content: string;
          buyerId: string;
          token: string;
          customer?: {
            name: string;
            email: string;
            phone: string;
            identify: { type: "CPF" | "CNPJ"; number: string };
          };
          address?: { zip_code?: string };
          installments?: string;
          returnUrl?: string;
        };

        try {
          body = await request.json();
        } catch (error) {
          log.error("Failed to parse request body", error);
          return errorResponse("Invalid request body", 400);
        }

        const userIp = getClientIp(request);
        const deviceUserAgent = request.headers.get("user-agent") ?? undefined;

        log.info("Processing payment", {
          outTradeNo: body.outTradeNo,
          method: body.method,
          orderAmount: body.orderAmount,
          userIp,
        });

        try {
          const result = await pagsmileClient.processPayment({
            outTradeNo: body.outTradeNo,
            method: body.method,
            orderAmount: body.orderAmount,
            orderCurrency: body.orderCurrency,
            subject: body.subject,
            content: body.content,
            buyerId: body.buyerId,
            token: body.token,
            userIp,
            customer: body.customer,
            address: body.address,
            installments: body.installments,
            deviceUserAgent,
            returnUrl: body.returnUrl,
            region: "BRA",
          });

          if (result.code !== "10000") {
            log.error("Pagsmile processPayment failed", {
              outTradeNo: body.outTradeNo,
              code: result.code,
              msg: result.msg,
            });
            return errorResponse(getErrorMessage(result.code, result.msg));
          }

          log.info("Payment processed", {
            outTradeNo: body.outTradeNo,
            tradeNo: result.trade_no,
            tradeStatus: result.trade_status,
          });

          return jsonResponse({
            tradeNo: result.trade_no,
            outTradeNo: result.out_trade_no,
            tradeStatus: result.trade_status,
            checkUrl: result.check_url,
            payUrl: result.pay_url,
          });
        } catch (error) {
          log.error("Failed to process payment", {
            outTradeNo: body.outTradeNo,
            error,
          });
          return errorResponse("Failed to process payment", 500);
        }
      },
    },

    "/api/payments/:outTradeNo": {
      GET: async (request) => {
        const outTradeNo = request.params.outTradeNo;
        log.info("GET /api/payments/:outTradeNo", { outTradeNo });

        try {
          const result = await pagsmileClient.queryPayment({ outTradeNo });

          if (result.code !== "10000") {
            log.error("Pagsmile queryPayment failed", {
              outTradeNo,
              code: result.code,
              msg: result.msg,
            });
            return errorResponse(getErrorMessage(result.code, result.msg));
          }

          log.info("Payment status retrieved", {
            outTradeNo,
            tradeStatus: result.trade_status,
          });

          return jsonResponse({
            tradeNo: result.trade_no,
            outTradeNo: result.out_trade_no,
            tradeStatus: result.trade_status,
            orderAmount: result.order_amount,
            orderCurrency: result.order_currency,
            refuseDetail: result.refuse_detail,
            isTerminal: isTerminalStatus(result.trade_status),
          });
        } catch (error) {
          log.error("Failed to query payment", { outTradeNo, error });
          return errorResponse("Failed to query payment", 500);
        }
      },
    },

    "/api/webhooks/pagsmile": {
      POST: async (request) => {
        log.info("POST /api/webhooks/pagsmile");

        try {
          const body = await request.json();
          log.info("Webhook received", body);
          return jsonResponse({ result: "success" });
        } catch (error) {
          log.error("Failed to process webhook", error);
          return errorResponse("Failed to process webhook", 500);
        }
      },
    },
  },

  development: {
    hmr: true,
    console: true,
  },
});

log.info(`Server running on port ${Bun.env.PORT ?? 3000}`, {
  env: PAGSMILE_ENV,
  baseUrl: BASE_URL,
});
