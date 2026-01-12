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
      GET: () =>
        jsonResponse({
          appId: PAGSMILE_APP_ID,
          publicKey: PAGSMILE_PUBLIC_KEY,
          env: PAGSMILE_ENV,
          regionCode: "BRA",
        }),
    },

    "/api/orders": {
      POST: async (request) => {
        const body = (await request.json()) as CreateOrderRequest;
        const outTradeNo = generateTradeNo();

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
          return errorResponse(getErrorMessage(result.code, result.msg));
        }

        return jsonResponse({
          tradeNo: result.trade_no,
          outTradeNo: result.out_trade_no,
          prepayId: result.prepay_id,
          webUrl: result.web_url,
        });
      },
    },

    "/api/payments": {
      POST: async (request) => {
        const body = (await request.json()) as {
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

        const userIp = getClientIp(request);
        const deviceUserAgent = request.headers.get("user-agent") ?? undefined;

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
          return errorResponse(getErrorMessage(result.code, result.msg));
        }

        return jsonResponse({
          tradeNo: result.trade_no,
          outTradeNo: result.out_trade_no,
          tradeStatus: result.trade_status,
          checkUrl: result.check_url,
          payUrl: result.pay_url,
        });
      },
    },

    "/api/payments/:outTradeNo": {
      GET: async (request) => {
        const outTradeNo = request.params.outTradeNo;

        const result = await pagsmileClient.queryPayment({ outTradeNo });

        if (result.code !== "10000") {
          return errorResponse(getErrorMessage(result.code, result.msg));
        }

        return jsonResponse({
          tradeNo: result.trade_no,
          outTradeNo: result.out_trade_no,
          tradeStatus: result.trade_status,
          orderAmount: result.order_amount,
          orderCurrency: result.order_currency,
          refuseDetail: result.refuse_detail,
          isTerminal: isTerminalStatus(result.trade_status),
        });
      },
    },

    "/api/webhooks/pagsmile": {
      POST: async (request) => {
        const body = await request.json();
        console.log("Webhook received:", body);
        return jsonResponse({ result: "success" });
      },
    },
  },

  development: {
    hmr: true,
    console: true,
  },
});

console.log("Server running at http://localhost:3000");
