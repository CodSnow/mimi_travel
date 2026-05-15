import dotenv from 'dotenv';

dotenv.config();

const deepSeekTimeoutMs = Number(process.env.DEEPSEEK_TIMEOUT_MS || 8000);

export const env = {
  port: Number(process.env.PORT || 3001),
  pythonServiceBaseUrl: process.env.PYTHON_SERVICE_BASE_URL || 'http://127.0.0.1:8000',
  internalApiToken:
    process.env.INTERNAL_API_TOKEN ||
    process.env.MIMI_INTERNAL_API_TOKEN ||
    'change-me',
  paymentMerchantId: process.env.PAYMENT_MERCHANT_ID || 'mimi-demo-merchant',
  paymentNotifySecret: process.env.PAYMENT_NOTIFY_SECRET || 'mimi-demo-notify-secret',
  deepSeekApiKey: process.env.DEEPSEEK_API_KEY,
  deepSeekBaseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  deepSeekModel: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  deepSeekTimeoutMs: Number.isFinite(deepSeekTimeoutMs) && deepSeekTimeoutMs > 0 ? deepSeekTimeoutMs : 8000,
  mapAmapWebKey: process.env.MAP_AMAP_WEB_KEY || process.env.AMAP_WEB_KEY || '',
  mapBaiduWebKey: process.env.MAP_BAIDU_WEB_KEY || process.env.BAIDU_MAP_WEB_KEY || '',
  mapSdkEnabled: process.env.MAP_SDK_ENABLED !== 'false',
};
