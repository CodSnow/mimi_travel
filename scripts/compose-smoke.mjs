const baseUrl = process.env.MIMI_SMOKE_BASE_URL || 'http://127.0.0.1:3001';

async function main() {
  await get('/health');
  await get('/api/state', (body) => Boolean(body.user) && Array.isArray(body.orders));
  await get('/api/knowledge', (body) => Array.isArray(body.documents) && body.documents.length > 0);
  await post('/api/ask', { question: '杭州猫咪检疫证明需要什么材料？' }, (body) => Boolean(body.answer));

  const login = await post('/api/auth/login', {
    phone: `139${Date.now().toString().slice(-8)}`,
    nickname: '冒烟用户',
    avatar: '🐱',
  });
  const userId = login.user.id;
  assert(userId, 'login should return user.id');

  const providers = await get('/api/providers', (body) => Array.isArray(body.items) && body.items.length > 0);
  const provider = providers.items.find((item) => item.services.includes('feeding')) || providers.items[0];
  assert(provider.userId, 'provider should return userId');

  const bundle = await get(`/api/providers/${provider.userId}`, (body) => Boolean(body.provider?.userId));
  const vehicleId = bundle.vehicles?.[0]?.id;

  const demand = await post('/api/demands', {
    userId,
    serviceType: 'feeding',
    title: 'Compose 冒烟上门喂猫',
    description: '端到端验收需求',
    district: provider.baseDistrict || '拱墅区',
    pickup: { district: provider.baseDistrict || '拱墅区', address: '祥符街道' },
    expectedPriceFen: 8800,
  });
  assert(demand.id, 'demand should return id');

  const offer = await post(`/api/demands/${demand.id}/offers`, {
    providerUserId: provider.userId,
    quoteAmountFen: 8800,
    message: '冒烟报价',
    vehicleId,
  });
  assert(offer.id, 'offer should return id');

  const accepted = await post(`/api/offers/${offer.id}/accept`, { operatorUserId: userId });
  const orderId = accepted.order.id;
  assert(orderId, 'accept offer should return order.id');

  const payment = await post('/api/payments', {
    orderId,
    operatorUserId: userId,
    channel: 'alipay',
    scene: 'full',
    idempotencyKey: `smoke-${orderId}`,
  });
  assert(payment.payment.id, 'payment should return payment.id');

  await post(`/api/payments/${payment.payment.id}/query`, {
    operatorUserId: userId,
    markPaid: true,
    providerTradeNo: `smoke-trade-${Date.now()}`,
  }, (body) => body.status === 'paid');

  const conversation = await post('/api/messages/conversations/ensure-order', { orderId });
  assert(conversation.id, 'conversation should return id');
  await post(`/api/messages/conversations/${conversation.id}`, {
    senderUserId: userId,
    content: '冒烟消息',
    messageType: 'text',
  });
  await get(`/api/messages/conversations/${conversation.id}?operatorUserId=${userId}`, (body) => Array.isArray(body.messages));

  console.log(`compose smoke passed: user=${userId} provider=${provider.userId} order=${orderId}`);
}

async function get(path, validate) {
  return request('GET', path, undefined, validate);
}

async function post(path, body, validate) {
  return request('POST', path, body, validate);
}

async function request(method, path, body, validate) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  const parsed = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`${method} ${path} failed with ${response.status}: ${text}`);
  }
  if (validate && !validate(parsed)) {
    throw new Error(`${method} ${path} returned unexpected body: ${text}`);
  }
  console.log(`${method} ${path} ok`);
  return parsed;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
