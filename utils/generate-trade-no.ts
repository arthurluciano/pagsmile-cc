export const generateTradeNo = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}${random}`;
};
