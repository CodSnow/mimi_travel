import { createHmac } from 'node:crypto';

import { Router, type Response } from 'express';

import { env } from '../../config/env.js';
import type { PrepayRiskCheckRequest } from '../../internal-dto/risk.js';
import { PythonClient, PythonClientError } from '../../services/python-client.js';
import { buildInternalRequestMeta } from '../../utils/request-meta.js';

export function createPaymentsRouter(pythonClient: PythonClient): Router {
  const router = Router();

  router.post('/api/payments', async (req, res) => {
    const body = req.body || {};
    if (!body.orderId || !body.channel || !body.scene) {
      return res.status(400).json({ error: 'orderId, channel and scene are required' });
    }

    try {
      const result = await pythonClient.createPayment(body);
      return res.status(201).json(result);
    } catch (error) {
      return handlePythonError(error, res);
    }
  });

  router.get('/api/payments/:id', async (req, res) => {
    try {
      const operatorUserId =
        typeof req.query.operatorUserId === 'string' ? req.query.operatorUserId : undefined;
      if (!operatorUserId) return res.status(400).json({ error: 'operatorUserId is required' });
      const payment = await pythonClient.getPayment(req.params.id, operatorUserId);
      return res.json(payment);
    } catch (error) {
      return handlePythonError(error, res);
    }
  });

  router.post('/api/payments/:id/query', async (req, res) => {
    try {
      if (!req.body?.operatorUserId) {
        return res.status(400).json({ error: 'operatorUserId is required' });
      }
      const payment = await pythonClient.queryPayment(req.params.id, {
        operatorUserId: req.body.operatorUserId,
        markPaid: Boolean(req.body.markPaid),
        providerTradeNo: req.body.providerTradeNo,
        rawPayload: req.body,
      });
      return res.json(payment);
    } catch (error) {
      return handlePythonError(error, res);
    }
  });

  router.post('/api/payments/:id/close', async (req, res) => {
    try {
      if (!req.body?.operatorUserId) {
        return res.status(400).json({ error: 'operatorUserId is required' });
      }
      const payment = await pythonClient.closePayment(req.params.id, {
        operatorUserId: req.body.operatorUserId,
      });
      return res.json(payment);
    } catch (error) {
      return handlePythonError(error, res);
    }
  });

  router.post('/api/payments/:id/refund', async (req, res) => {
    try {
      if (!req.body?.operatorUserId) {
        return res.status(400).json({ error: 'operatorUserId is required' });
      }
      const result = await pythonClient.refundPayment(req.params.id, {
        operatorUserId: req.body.operatorUserId,
        reason: req.body.reason,
        refundAmountFen: req.body.refundAmountFen,
      });
      return res.json(result);
    } catch (error) {
      return handlePythonError(error, res);
    }
  });

  router.post('/api/payments/notify/alipay', async (req, res) => {
    return handlePaymentNotify('alipay', req.body, pythonClient, res);
  });

  router.post('/api/payments/notify/wechat', async (req, res) => {
    return handlePaymentNotify('wechat_pay', req.body, pythonClient, res);
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

async function handlePaymentNotify(channel: 'alipay' | 'wechat_pay', body: any, pythonClient: PythonClient, res: Response) {
  const outTradeNo = body?.outTradeNo || body?.out_trade_no;
  if (!outTradeNo) return res.status(400).json({ error: 'outTradeNo is required' });

  try {
    const merchantId = firstString(body?.merchantId, body?.merchant_id, body?.mch_id);
    if (!merchantId || merchantId !== env.paymentMerchantId) {
      return res.status(400).json({ error: 'invalid merchant id' });
    }

    const amountFen = resolveNotifyAmountFen(body);
    if (amountFen === null) {
      return res.status(400).json({ error: 'payment amount mismatch' });
    }

    const signature = firstString(body?.sign, body?.signature);
    if (!signature) {
      return res.status(400).json({ error: 'signature is required' });
    }

    const expectedSignature = createHmac('sha256', env.paymentNotifySecret)
      .update(`${env.paymentMerchantId}:${outTradeNo}:${amountFen}`)
      .digest('hex');
    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'invalid notify signature' });
    }

    const paidPayment = await pythonClient.notifyPayment({
      outTradeNo,
      providerTradeNo: body?.providerTradeNo || body?.trade_no,
      rawPayload: { ...body, channel },
    });
    return res.json({ ok: true, payment: paidPayment });
  } catch (error) {
    return handlePythonError(error, res);
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
      error: pythonErrorMessage(error),
      details: error.details,
    });
  }
  return res.status(500).json({ error: 'unexpected payment error' });
}

function pythonErrorMessage(error: PythonClientError): string {
  const details = error.details as { detail?: unknown } | undefined;
  return typeof details?.detail === 'string' ? details.detail : error.message;
}
