const DEFAULT_AMOUNT_USD = '10.00';
const DEFAULT_CURRENCY = 'USD';

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 10_000) {
        reject(new Error('Solicitud demasiado grande'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (_error) {
        reject(new Error('JSON inválido'));
      }
    });
    req.on('error', reject);
  });
}

function safeText(value, max = 160) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function getPayPalBaseUrl() {
  return process.env.PAYPAL_ENV === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';
}

async function getAccessToken(baseUrl, clientId, clientSecret) {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || 'No se pudo autenticar PayPal.');
  }
  return payload.access_token;
}

function findCapture(order) {
  return order?.purchase_units
    ?.flatMap((unit) => unit.payments?.captures || [])
    ?.find((capture) => capture.status === 'COMPLETED');
}

function validateCompletedOrder(order, reference) {
  const purchaseUnit = order?.purchase_units?.[0];
  const capture = findCapture(order);
  const amount = capture?.amount || purchaseUnit?.amount;
  const expectedAmount = process.env.CONSULTA_AMOUNT_USD || DEFAULT_AMOUNT_USD;
  const expectedCurrency = process.env.PAYPAL_CURRENCY || DEFAULT_CURRENCY;
  const matchesReference = !reference || purchaseUnit?.custom_id === reference || purchaseUnit?.reference_id === reference;

  return Boolean(
    order?.status === 'COMPLETED' &&
    capture?.status === 'COMPLETED' &&
    matchesReference &&
    amount?.currency_code === expectedCurrency &&
    Number(amount?.value) === Number(expectedAmount)
  );
}

async function getOrder(baseUrl, accessToken, orderId) {
  const response = await fetch(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.details?.[0]?.description || 'No se pudo consultar la orden de PayPal.');
  }
  return data;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Método no permitido' });
  }

  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return json(res, 500, {
        error: 'PayPal no está configurado todavía. Faltan PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET.'
      });
    }

    const body = await readBody(req);
    const orderId = safeText(body.orderId || body.token, 80);
    const reference = safeText(body.reference, 80);

    if (!orderId) {
      return json(res, 400, { error: 'Falta el ID de orden de PayPal.' });
    }

    const baseUrl = getPayPalBaseUrl();
    const accessToken = await getAccessToken(baseUrl, clientId, clientSecret);

    let response = await fetch(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        'PayPal-Request-Id': `${reference || orderId}-capture`.slice(0, 108)
      },
      body: '{}'
    });
    let order = await response.json().catch(() => ({}));

    if (!response.ok) {
      const issue = order.details?.[0]?.issue;
      if (issue === 'ORDER_ALREADY_CAPTURED' || issue === 'ORDER_ALREADY_AUTHORIZED') {
        order = await getOrder(baseUrl, accessToken, orderId);
      } else {
        return json(res, response.status || 502, {
          error: order.message || order.details?.[0]?.description || 'No se pudo capturar el pago de PayPal.'
        });
      }
    }

    if (!validateCompletedOrder(order, reference)) {
      return json(res, 409, {
        error: 'PayPal no confirmó un pago completado por el valor esperado de USD $10.'
      });
    }

    const purchaseUnit = order.purchase_units?.[0];
    const capture = findCapture(order);

    return json(res, 200, {
      approved: true,
      provider: 'paypal',
      orderId: order.id,
      captureId: capture?.id || '',
      reference: reference || purchaseUnit?.custom_id || purchaseUnit?.reference_id || '',
      status: order.status,
      amount: capture?.amount || purchaseUnit?.amount
    });
  } catch (error) {
    return json(res, 500, { error: error.message || 'No se pudo validar el pago de PayPal.' });
  }
};
