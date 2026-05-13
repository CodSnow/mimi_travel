import { createHmac } from 'node:crypto';

import { Router, type Response } from 'express';

import { env } from '../../config/env.js';
import type { PrepayRiskCheckRequest } from '../../internal-dto/risk.js';
import { DomainStore } from '../../services/domain-store.js';
import { PythonClient, PythonClientError } from '../../services/python-client.js';
import { handleDomainError } from '../../utils/domain-errors.js';
import { buildInternalRequestMeta } from '../../utils/request-meta.js';

export function createPaymentsRouter(pythonClient: PythonClient, domainStore: DomainStore): Router {
  const router = Router();

  router.post('/api/payments', async (req, res) => {
    const body = req.body || {};
    if (!body.orderId || !body.channel || !body.scene) {
      return res.status(400).json({ error: 'orderId, channel and scene are required' });
    }

    try {
      const result = await domainStore.createPayment(body);
      return res.status(201).json(result);
    } catch (error) {
      return handleDomainError(error, res, 'unexpected payment error');
    }
  });

  router.get('/api/payments/:id', async (req, res) => {
    try {
      const payment = await domainStore.getPayment(req.params.id);
      if (!payment) return res.status(404).json({ error: 'payment not found' });
      return res.json(payment);
    } catch (error) {
      return handleDomainError(error, res, 'unexpected payment error');
    }
  });

  router.post('/api/payments/:id/query', async (req, res) => {
    try {
      const payment = req.body?.markPaid
        ? await domainStore.markPaymentPaid(req.params.id, req.body.providerTradeNo, req.body)
        : await domainStore.getPayment(req.params.id);
      if (!payment) return res.status(404).json({ error: 'payment not found' });
      return res.json(payment);
    } catch (error) {
      return handleDomainError(error, res, 'unexpected payment error');
    }
  });

  router.post('/api/payments/:id/refund', async (req, res) => {
    try {
      const result = await domainStore.refundPayment(req.params.id, req.body?.reason);
      return res.json(result);
    } catch (error) {
      return handleDomainError(error, res, 'unexpected payment error');
    }
  });

  router.post('/api/payments/notify/alipay', async (req, res) => {
    return handlePaymentNotify('alipay', req.body, domainStore, res);
  });

  router.post('/api/payments/notify/wechat', async (req, res) => {
    return handlePaymentNotify('wechat_pay', req.body, domainStore, res);
  });

  router.post('/api/payments/prepay-check', async (req, res) => {
    const body = req.body as Omit<PrepayRiskCheckRequest, 'meta'> & { operatorUserId?: string };
    if (!body?.order || !body?.payment) {
      return res.status(400).json({ error: 'order and payment are required' });
    }

    try {
      const result = await pythonClient.prepayCheck({
        ...body,
        meta: buildInternalRequestMeta(body.operatorUserId),
      });
      return res.json(result);
    } catch (error) {
      return handlePythonError(error, res);
    }
  });

  return router;
}

async function handlePaymentNotify(channel: 'alipay' | 'wechat_pay', body: any, domainStore: DomainStore, res: Response) {
  const outTradeNo = body?.outTradeNo || body?.out_trade_no;
  if (!outTradeNo) return res.status(400).json({ error: 'outTradeNo is required' });

  try {
    const payment = await domainStore.getPaymentByOutTradeNo(outTradeNo);
    if (!payment) return res.status(404).json({ error: 'payment not found' });
    if (payment.channel !== channel) {
      return res.status(409).json({ error: 'payment channel mismatch' });
    }

    const merchantId = firstString(body?.merchantId, body?.merchant_id, body?.mch_id);
    if (!merchantId || merchantId !== env.paymentMerchantId) {
      return res.status(400).json({ error: 'invalid merchant id' });
    }

    const amountFen = resolveNotifyAmountFen(body);
    if (amountFen === null || amountFen !== payment.amountFen) {
      return res.status(400).json({ error: 'payment amount mismatch' });
    }

    const signature = firstString(body?.sign, body?.signature);
    if (!signature) {
      return res.status(400).json({ error: 'signature is required' });
    }

    const expectedSignature = createHmac('sha256', env.paymentNotifySecret)
      .update(`${env.paymentMerchantId}:${outTradeNo}:${payment.amountFen}`)
      .digest('hex');
    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'invalid notify signature' });
    }

    const paidPayment = await domainStore.markPaymentPaidByOutTradeNo(
      outTradeNo,
      body?.providerTradeNo || body?.trade_no,
      body,
    );
    return res.json({ ok: true, payment: paidPayment });
  } catch (error) {
    return handleDomainError(error, res, 'unexpected payment notify error');
  }
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function resolveNotifyAmountFen(body: any): number | null {
  const fenValue =
    body?.amountFen ?? body?.amount_fen ?? body?.totalFee ?? body?.total_fee ?? body?.cashFee ?? body?.cash_fee;
  if (fenValue !== undefined) {
    const parsed = Number(fenValue);
    return Number.isFinite(parsed) ? Math.round(parsed) : null;
  }

  const yuanValue = body?.amount ?? body?.total_amount;
  if (yuanValue === undefined) return null;
  const parsed = Number(yuanValue);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 100);
}

function handlePythonError(error: unknown, res: Response) {
  if (error instanceof PythonClientError) {
    return res.status(error.statusCode).json({
      error: error.message,
      details: error.details,
    });
  }
  return res.status(500).json({ error: 'unexpected payment error' });
}
