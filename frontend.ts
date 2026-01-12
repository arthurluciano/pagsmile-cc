import type {
  PagsmileConfig,
  PagsmileClientInstance,
  PagsmileCreateOrderParams,
  PagsmileRegion,
  PagsmileEnvironment,
} from "./types/pagsmile";
import type { PaymentStep, TradeStatus } from "./types/payment";

interface AppConfig {
  appId: string;
  publicKey: string;
  env: PagsmileEnvironment;
  regionCode: PagsmileRegion;
}

interface PaymentState {
  step: PaymentStep;
  prepayId: string | null;
  outTradeNo: string | null;
  tradeNo: string | null;
  status: TradeStatus | null;
  errorMessage: string | null;
  checkUrl: string | null;
}

interface OrderData {
  orderAmount: string;
  subject: string;
  content: string;
  buyerId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    identify: {
      type: "CPF";
      number: string;
    };
  };
  installments: string;
}

const CARD_BRANDS: Record<string, { pattern: RegExp; icon: string }> = {
  visa: {
    pattern: /^4/,
    icon: `<svg viewBox="0 0 48 32" fill="none"><rect width="48" height="32" rx="4" fill="#1A1F71"/><path d="M19.5 21h-3l1.9-12h3l-1.9 12zm8.2-11.7c-.6-.2-1.5-.5-2.7-.5-3 0-5.1 1.6-5.1 3.8 0 1.7 1.5 2.6 2.6 3.1 1.1.6 1.5.9 1.5 1.4 0 .8-.9 1.1-1.7 1.1-1.1 0-1.7-.2-2.7-.6l-.4-.2-.4 2.5c.7.3 1.9.6 3.2.6 3.2 0 5.2-1.6 5.2-3.9 0-1.3-.8-2.3-2.5-3.1-1-.5-1.7-.9-1.7-1.4 0-.5.5-1 1.7-1 1 0 1.7.2 2.2.4l.3.1.4-2.3zm7.9-.3h-2.3c-.7 0-1.3.2-1.6 1l-4.5 10.7h3.2l.6-1.8h3.9l.4 1.8h2.8l-2.5-11.7zm-3.7 7.6l1.2-3.4.3-.9.2.9.7 3.4h-2.4zM17 9l-3 8.2-.3-1.6c-.5-1.8-2.2-3.8-4.1-4.8l2.7 10.1h3.2l4.8-11.9H17z" fill="#fff"/></svg>`,
  },
  mastercard: {
    pattern: /^5[1-5]/,
    icon: `<svg viewBox="0 0 48 32" fill="none"><rect width="48" height="32" rx="4" fill="#000"/><circle cx="18" cy="16" r="10" fill="#EB001B"/><circle cx="30" cy="16" r="10" fill="#F79E1B"/><path d="M24 8.5a10 10 0 000 15 10 10 0 000-15z" fill="#FF5F00"/></svg>`,
  },
  amex: {
    pattern: /^3[47]/,
    icon: `<svg viewBox="0 0 48 32" fill="none"><rect width="48" height="32" rx="4" fill="#006FCF"/><path d="M8 21h2.5l.5-1.2h2l.5 1.2H16v-6l3.5 6H22v-8h-2v5.5l-3-5.5h-3v7.3l-2.5-7.3H9l-2.5 7h2l.5-1.2zm3-2.5l.7-2 .8 2h-1.5zm17-5.5h-7v8h7v-1.5h-5v-1.7h4.8v-1.5H23v-1.8h5V13zm8 4l-2.2-4H32l1.5 2.7L35 13h-2.2l.7 1.5-1.5 2.5 2.5 4H32l-1.5-2.7L29 21h2.2l.8-1.5 1.5-2.5z" fill="#fff"/></svg>`,
  },
  elo: {
    pattern: /^(4011|4312|4389|4514|4573|4576|5041|5066|5067|509|6277|6362|6363|650|651|652|653|654|655|656|657|658)/,
    icon: `<svg viewBox="0 0 48 32" fill="none"><rect width="48" height="32" rx="4" fill="#000"/><path d="M12 12h4v8h-4z" fill="#FFF100"/><path d="M18 12h4v8h-4z" fill="#00A4E0"/><path d="M24 12h4v8h-4z" fill="#EE4023"/><text x="32" y="18" font-size="6" fill="#fff" font-weight="bold">elo</text></svg>`,
  },
  hipercard: {
    pattern: /^(38|60)/,
    icon: `<svg viewBox="0 0 48 32" fill="none"><rect width="48" height="32" rx="4" fill="#822124"/><text x="24" y="18" text-anchor="middle" font-size="8" fill="#fff" font-weight="bold">HIPERCARD</text></svg>`,
  },
};

const formatCardNumber = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  const groups = numbers.match(/.{1,4}/g);
  return groups ? groups.join(" ") : numbers;
};

const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
};

const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 2) return numbers.length ? `(${numbers}` : "";
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

const formatAmount = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  if (!numbers) return "";
  const amount = parseInt(numbers, 10) / 100;
  return amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseAmount = (formatted: string): string => {
  const numbers = formatted.replace(/\D/g, "");
  if (!numbers) return "0.00";
  const amount = parseInt(numbers, 10) / 100;
  return amount.toFixed(2);
};

const detectCardBrand = (cardNumber: string): string | null => {
  const numbers = cardNumber.replace(/\D/g, "");
  for (const [brand, { pattern }] of Object.entries(CARD_BRANDS)) {
    if (pattern.test(numbers)) return brand;
  }
  return null;
};

const validateCPF = (cpf: string): boolean => {
  const numbers = cpf.replace(/\D/g, "");
  if (numbers.length !== 11) return false;
  if (/^(\d)\1+$/.test(numbers)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const digit = numbers[i];
    if (digit === undefined) return false;
    sum += parseInt(digit, 10) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  const ninthDigit = numbers[9];
  if (ninthDigit === undefined || remainder !== parseInt(ninthDigit, 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    const digit = numbers[i];
    if (digit === undefined) return false;
    sum += parseInt(digit, 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  const tenthDigit = numbers[10];
  if (tenthDigit === undefined) return false;
  return remainder === parseInt(tenthDigit, 10);
};

const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

class PaymentApp {
  private config: AppConfig | null = null;
  private pagsmileClient: PagsmileClientInstance | null = null;
  private state: PaymentState = {
    step: "idle",
    prepayId: null,
    outTradeNo: null,
    tradeNo: null,
    status: null,
    errorMessage: null,
    checkUrl: null,
  };
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  private elements = {
    form: document.getElementById("payment-form") as HTMLFormElement,
    submitBtn: document.getElementById("submit-btn") as HTMLButtonElement,
    btnAmount: document.getElementById("btn-amount") as HTMLSpanElement,
    cardNumber: document.getElementById("card-number") as HTMLInputElement,
    cardName: document.getElementById("card-name") as HTMLInputElement,
    expMonth: document.getElementById("exp-month") as HTMLSelectElement,
    expYear: document.getElementById("exp-year") as HTMLSelectElement,
    cvv: document.getElementById("card-cvv") as HTMLInputElement,
    cpf: document.getElementById("customer-cpf") as HTMLInputElement,
    email: document.getElementById("customer-email") as HTMLInputElement,
    phone: document.getElementById("customer-phone") as HTMLInputElement,
    amount: document.getElementById("order-amount") as HTMLInputElement,
    installments: document.getElementById("installments") as HTMLSelectElement,
    detectedBrand: document.getElementById("detected-brand") as HTMLDivElement,
    cardNumberPreview: document.getElementById("card-number-preview") as HTMLDivElement,
    cardHolderPreview: document.getElementById("card-holder-preview") as HTMLSpanElement,
    cardExpiryPreview: document.getElementById("card-expiry-preview") as HTMLSpanElement,
    threedsModal: document.getElementById("threeds-modal") as HTMLDivElement,
    threedsIframe: document.getElementById("threeds-iframe") as HTMLIFrameElement,
    cancelThreeds: document.getElementById("cancel-threeds") as HTMLButtonElement,
    statusOverlay: document.getElementById("status-overlay") as HTMLDivElement,
    statusProcessing: document.getElementById("status-processing") as HTMLDivElement,
    statusSuccess: document.getElementById("status-success") as HTMLDivElement,
    statusError: document.getElementById("status-error") as HTMLDivElement,
    successTradeNo: document.getElementById("success-trade-no") as HTMLSpanElement,
    errorMessage: document.getElementById("error-message") as HTMLParagraphElement,
    newPaymentBtn: document.getElementById("new-payment-btn") as HTMLButtonElement,
    retryBtn: document.getElementById("retry-btn") as HTMLButtonElement,
  };

  async init(): Promise<void> {
    await this.fetchConfig();
    this.populateYearOptions();
    this.setupEventListeners();
    this.setupInputFormatters();
  }

  private async fetchConfig(): Promise<void> {
    const response = await fetch("/api/config");
    this.config = await response.json();
  }

  private populateYearOptions(): void {
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 15; i++) {
      const year = currentYear + i;
      const option = document.createElement("option");
      option.value = String(year).slice(-2);
      option.textContent = String(year);
      this.elements.expYear.appendChild(option);
    }
  }

  private setupEventListeners(): void {
    this.elements.form.addEventListener("submit", (e) => this.handleSubmit(e));
    this.elements.cancelThreeds.addEventListener("click", () => this.cancel3DS());
    this.elements.newPaymentBtn.addEventListener("click", () => this.resetForm());
    this.elements.retryBtn.addEventListener("click", () => this.resetForm());

    window.addEventListener("message", (e) => this.handle3DSMessage(e));
  }

  private setupInputFormatters(): void {
    this.elements.cardNumber.addEventListener("input", (e) => {
      const input = e.target as HTMLInputElement;
      const formatted = formatCardNumber(input.value);
      input.value = formatted;
      this.updateCardPreview();
      this.updateCardBrand();
    });

    this.elements.cardName.addEventListener("input", () => {
      this.updateCardPreview();
    });

    this.elements.expMonth.addEventListener("change", () => {
      this.updateCardPreview();
    });

    this.elements.expYear.addEventListener("change", () => {
      this.updateCardPreview();
    });

    this.elements.cpf.addEventListener("input", (e) => {
      const input = e.target as HTMLInputElement;
      input.value = formatCPF(input.value);
    });

    this.elements.phone.addEventListener("input", (e) => {
      const input = e.target as HTMLInputElement;
      input.value = formatPhone(input.value);
    });

    this.elements.amount.addEventListener("input", (e) => {
      const input = e.target as HTMLInputElement;
      input.value = formatAmount(input.value);
      this.updateButtonAmount();
    });

    this.elements.installments.addEventListener("change", () => {
      this.updateButtonAmount();
    });
  }

  private updateCardPreview(): void {
    const cardNumber = this.elements.cardNumber.value || "•••• •••• •••• ••••";
    const cardName = this.elements.cardName.value.toUpperCase() || "SEU NOME";
    const month = this.elements.expMonth.value || "MM";
    const year = this.elements.expYear.value || "AA";

    this.elements.cardNumberPreview.textContent = cardNumber.padEnd(19, "•").replace(/(.{4})(.{4})(.{4})(.{4})/, "$1 $2 $3 $4").substring(0, 19);
    this.elements.cardHolderPreview.textContent = cardName;
    this.elements.cardExpiryPreview.textContent = `${month}/${year}`;
  }

  private updateCardBrand(): void {
    const brand = detectCardBrand(this.elements.cardNumber.value);
    if (brand && CARD_BRANDS[brand]) {
      this.elements.detectedBrand.innerHTML = CARD_BRANDS[brand].icon;
    } else {
      this.elements.detectedBrand.innerHTML = "";
    }
  }

  private updateButtonAmount(): void {
    const amount = parseAmount(this.elements.amount.value);
    const installments = parseInt(this.elements.installments.value, 10);
    const numAmount = parseFloat(amount);

    if (numAmount > 0) {
      if (installments > 1) {
        const perInstallment = (numAmount / installments).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });
        this.elements.btnAmount.textContent = `${installments}x de ${perInstallment}`;
      } else {
        this.elements.btnAmount.textContent = numAmount.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });
      }
    } else {
      this.elements.btnAmount.textContent = "";
    }
  }

  private validateForm(): boolean {
    let isValid = true;

    const clearError = (input: HTMLInputElement | HTMLSelectElement, errorId: string) => {
      input.classList.remove("error");
      const errorEl = document.getElementById(errorId);
      if (errorEl) errorEl.textContent = "";
    };

    const setError = (input: HTMLInputElement | HTMLSelectElement, errorId: string, message: string) => {
      input.classList.add("error");
      const errorEl = document.getElementById(errorId);
      if (errorEl) errorEl.textContent = message;
      isValid = false;
    };

    clearError(this.elements.cardNumber, "card-number-error");
    const cardNumbers = this.elements.cardNumber.value.replace(/\D/g, "");
    if (cardNumbers.length < 13 || cardNumbers.length > 19) {
      setError(this.elements.cardNumber, "card-number-error", "Número do cartão inválido");
    }

    clearError(this.elements.cardName, "card-name-error");
    if (this.elements.cardName.value.trim().length < 3) {
      setError(this.elements.cardName, "card-name-error", "Nome inválido");
    }

    clearError(this.elements.cvv, "cvv-error");
    const cvvNumbers = this.elements.cvv.value.replace(/\D/g, "");
    if (cvvNumbers.length < 3 || cvvNumbers.length > 4) {
      setError(this.elements.cvv, "cvv-error", "CVV inválido");
    }

    clearError(this.elements.cpf, "cpf-error");
    if (!validateCPF(this.elements.cpf.value)) {
      setError(this.elements.cpf, "cpf-error", "CPF inválido");
    }

    clearError(this.elements.email, "email-error");
    if (!validateEmail(this.elements.email.value)) {
      setError(this.elements.email, "email-error", "E-mail inválido");
    }

    clearError(this.elements.phone, "phone-error");
    const phoneNumbers = this.elements.phone.value.replace(/\D/g, "");
    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      setError(this.elements.phone, "phone-error", "Telefone inválido");
    }

    const amount = parseFloat(parseAmount(this.elements.amount.value));
    if (amount < 1) {
      isValid = false;
    }

    return isValid;
  }

  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();

    if (!this.validateForm()) return;
    if (!this.config) return;

    this.setLoading(true);
    this.showStatus("processing");

    const orderData = this.collectFormData();

    const orderResponse = await this.createOrder(orderData);
    if (!orderResponse) {
      this.showStatus("error");
      this.setLoading(false);
      return;
    }

    this.state.outTradeNo = orderResponse.outTradeNo;
    this.state.prepayId = orderResponse.prepayId;

    const initialized = await this.initializePagsmileSDK(orderResponse.prepayId);
    if (!initialized) {
      this.showStatus("error");
      this.setLoading(false);
      return;
    }

    await this.processPaymentWithSDK(orderData);
  }

  private collectFormData(): OrderData {
    return {
      orderAmount: parseAmount(this.elements.amount.value),
      subject: "Pagamento via cartão de crédito",
      content: "Pagamento processado via Pagsmile",
      buyerId: `buyer_${Date.now()}`,
      customer: {
        name: this.elements.cardName.value,
        email: this.elements.email.value,
        phone: this.elements.phone.value.replace(/\D/g, ""),
        identify: {
          type: "CPF",
          number: this.elements.cpf.value.replace(/\D/g, ""),
        },
      },
      installments: this.elements.installments.value,
    };
  }

  private async createOrder(data: OrderData): Promise<{ outTradeNo: string; prepayId: string } | null> {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderAmount: data.orderAmount,
        orderCurrency: "BRL",
        subject: data.subject,
        content: data.content,
        buyerId: data.buyerId,
        customer: data.customer,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      this.state.errorMessage = error.error ?? "Erro ao criar pedido";
      return null;
    }

    const result = await response.json();
    return {
      outTradeNo: result.outTradeNo,
      prepayId: result.prepayId,
    };
  }

  private async initializePagsmileSDK(prepayId: string): Promise<boolean> {
    if (!this.config) return false;

    const sdkConfig: PagsmileConfig = {
      app_id: this.config.appId,
      public_key: this.config.publicKey,
      env: this.config.env,
      region_code: this.config.regionCode,
      prepay_id: prepayId,
      fields: {
        card_name: { id_selector: "card-name" },
        card_number: { id_selector: "card-number" },
        expiration_month: { id_selector: "exp-month" },
        expiration_year: { id_selector: "exp-year" },
        cvv: { id_selector: "card-cvv" },
      },
    };

    this.pagsmileClient = await Pagsmile.setPublishableKey(sdkConfig);
    return true;
  }

  private async processPaymentWithSDK(data: OrderData): Promise<void> {
    if (!this.pagsmileClient) {
      this.state.errorMessage = "SDK não inicializado";
      this.showStatus("error");
      this.setLoading(false);
      return;
    }

    const params: PagsmileCreateOrderParams = {
      installments: { stage: parseInt(data.installments, 10) },
      email: data.customer.email,
      phone: data.customer.phone,
      payer_id: data.customer.identify.number,
    };

    const result = await this.pagsmileClient.createOrder(params);

    if (result.status === "success" && result.query) {
      this.startPolling();
    } else if (result.status === "error") {
      this.state.errorMessage = result.message ?? "Erro ao processar pagamento";
      this.showStatus("error");
      this.setLoading(false);
    }
  }

  private startPolling(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);

    const poll = async () => {
      if (!this.state.outTradeNo) return;

      const response = await fetch(`/api/payments/${this.state.outTradeNo}`);
      if (!response.ok) return;

      const result = await response.json();
      this.state.status = result.tradeStatus;
      this.state.tradeNo = result.tradeNo;

      if (result.tradeStatus === "SUCCESS") {
        this.stopPolling();
        this.elements.successTradeNo.textContent = result.tradeNo;
        this.showStatus("success");
        this.setLoading(false);
        return;
      }

      if (result.isTerminal) {
        this.stopPolling();
        this.state.errorMessage = result.refuseDetail ?? "Pagamento recusado";
        this.showStatus("error");
        this.setLoading(false);
        return;
      }
    };

    poll();
    this.pollInterval = setInterval(poll, 3000);

    setTimeout(() => {
      if (this.pollInterval && this.state.step === "polling_status") {
        this.stopPolling();
        this.state.errorMessage = "Tempo limite excedido. Verifique o status do pagamento.";
        this.showStatus("error");
        this.setLoading(false);
      }
    }, 120000);
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private show3DSChallenge(checkUrl: string): void {
    this.state.checkUrl = checkUrl;
    this.elements.threedsIframe.src = checkUrl;
    this.elements.threedsModal.hidden = false;
  }

  private hide3DSChallenge(): void {
    this.elements.threedsModal.hidden = true;
    this.elements.threedsIframe.src = "";
    this.state.checkUrl = null;
  }

  private cancel3DS(): void {
    this.hide3DSChallenge();
    this.stopPolling();
    this.state.errorMessage = "Verificação 3DS cancelada";
    this.showStatus("error");
    this.setLoading(false);
  }

  private handle3DSMessage(event: MessageEvent): void {
    if (event.data?.type === "3ds-complete") {
      this.hide3DSChallenge();
      this.startPolling();
    }
  }

  private showStatus(status: "processing" | "success" | "error"): void {
    this.elements.statusOverlay.hidden = false;
    this.elements.statusProcessing.hidden = status !== "processing";
    this.elements.statusSuccess.hidden = status !== "success";
    this.elements.statusError.hidden = status !== "error";

    if (status === "error" && this.state.errorMessage) {
      this.elements.errorMessage.textContent = this.state.errorMessage;
    }
  }

  private hideStatus(): void {
    this.elements.statusOverlay.hidden = true;
  }

  private setLoading(loading: boolean): void {
    this.elements.submitBtn.disabled = loading;
    this.elements.submitBtn.classList.toggle("loading", loading);
  }

  private resetForm(): void {
    this.hideStatus();
    this.hide3DSChallenge();
    this.stopPolling();

    this.state = {
      step: "idle",
      prepayId: null,
      outTradeNo: null,
      tradeNo: null,
      status: null,
      errorMessage: null,
      checkUrl: null,
    };

    this.elements.form.reset();
    this.updateCardPreview();
    this.updateCardBrand();
    this.updateButtonAmount();
    this.setLoading(false);
  }
}

const app = new PaymentApp();
app.init();
