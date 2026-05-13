const { onRequest } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

function normalizeStatus(rawStatus) {
  const status = String(rawStatus || '').toLowerCase();
  if (['paid', 'approved', 'succeeded', 'success'].includes(status)) return 'approved';
  if (['refused', 'rejected', 'cancelled', 'canceled', 'failed'].includes(status)) return 'rejected';
  if (['shipped'].includes(status)) return 'shipped';
  if (['delivered'].includes(status)) return 'delivered';
  return null;
}

function extractOrderId(body) {
  return (
    body.orderId ||
    body.order_id ||
    body.external_reference ||
    body.externalReference ||
    body.metadata?.orderId ||
    body.data?.orderId ||
    body.data?.external_reference ||
    null
  );
}

exports.paymentWebhook = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  const configuredSecret = process.env.WEBHOOK_SECRET;
  const headerSecret = req.get('x-webhook-secret') || req.get('authorization') || '';

  if (configuredSecret && headerSecret !== configuredSecret && headerSecret !== `Bearer ${configuredSecret}`) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }

  const body = req.body || {};
  const orderId = extractOrderId(body);
  const mappedStatus = normalizeStatus(body.status || body.paymentStatus || body.data?.status);

  if (!orderId || !mappedStatus) {
    logger.warn('Webhook ignorado por payload incompleto', body);
    res.status(400).json({ ok: false, error: 'invalid_payload' });
    return;
  }

  const orderRef = db.collection('orders').doc(String(orderId));
  const snap = await orderRef.get();

  if (!snap.exists) {
    res.status(404).json({ ok: false, error: 'order_not_found' });
    return;
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  const update = {
    status: mappedStatus,
    updatedAt: now,
    paymentWebhook: {
      provider: body.provider || body.source || 'generic',
      rawStatus: body.status || body.paymentStatus || body.data?.status || null,
      receivedAt: new Date().toISOString()
    }
  };

  await orderRef.set(update, { merge: true });
  logger.info('Pedido atualizado por webhook', { orderId, mappedStatus });
  res.json({ ok: true, orderId, status: mappedStatus });
});
