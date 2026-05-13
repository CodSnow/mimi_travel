import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 3001),
  pythonServiceBaseUrl: process.env.PYTHON_SERVICE_BASE_URL || 'http://127.0.0.1:8000',
  internalApiToken:
    process.env.INTERNAL_API_TOKEN ||
    process.env.MIMI_INTERNAL_API_TOKEN ||
    'change-me',
  paymentMerchantId: process.env.PAYMENT_MERCHANT_ID || 'mimi-demo-merchant',
  paymentNotifySecret: process.env.PAYMENT_NOTIFY_SECRET || 'mimi-demo-notify-secret',
};
