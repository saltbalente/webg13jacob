const DEFAULT_AMOUNT_USD = '10.00';
const DEFAULT_CURRENCY = 'USD';
const DEFAULT_PRODUCT_NAME = 'Consulta privada Maestro Jacob';

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function safeText(value, max = 160) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 20_000) {
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

function getOrigin(req) {
  const configured = process.env.FRONTEND_URL || process.env.SITE_URL;
  if (configured) return configured.replace(/\/+$/, '');

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`.replace(/\/+$/, '');
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

function validateProfile(profile) {
  const customerName = safeText(profile.customerName, 100);
  const customerEmail = safeText(profile.customerEmail, 180).toLowerCase();
  const customerPhone = safeText(profile.customerPhone, 40);
  const reference = safeText(profile.reference, 80);

  if (customerName.length < 2 || !/^\S+@\S+\.\S+$/.test(customerEmail) || customerPhone.length < 5 || !reference) {
    throw new Error('Nombre, correo, WhatsApp y referencia son obligatorios para iniciar PayPal.');
  }

  return { customerName, customerEmail, customerPhone, reference };
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
    const { customerName, customerEmail, customerPhone, reference } = validateProfile(body);
    const amount = process.env.CONSULTA_AMOUNT_USD || DEFAULT_AMOUNT_USD;
    const currency = process.env.PAYPAL_CURRENCY || DEFAULT_CURRENCY;
    const origin = getOrigin(req);
    const baseUrl = getPayPalBaseUrl();
    const accessToken = await getAccessToken(baseUrl, clientId, clientSecret);

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: reference,
          custom_id: reference,
          invoice_id: reference.slice(0, 127),
          description: DEFAULT_PRODUCT_NAME,
          amount: {
            currency_code: currency,
            value: amount
          }
        }
      ],
      payer: {
        name: {
          given_name: customerName.slice(0, 140)
        },
        email_address: customerEmail,
        phone: {
          phone_type: 'MOBILE',
          phone_number: {
            national_number: customerPhone.replace(/\D/g, '').slice(-14) || '0000000'
          }
        }
      },
      application_context: {
        brand_name: 'Maestro Jacob',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        shipping_preference: 'NO_SHIPPING',
        return_url: `${origin}/consulta-confirmacion.html?provider=paypal&ref=${encodeURIComponent(reference)}`,
        cancel_url: `${origin}/consulta.html?payment=cancelled&provider=paypal&ref=${encodeURIComponent(reference)}`
      }
    };

    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(orderPayload)
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.id) {
      return json(res, response.status || 502, {
        error: data.message || data.details?.[0]?.description || 'No se pudo crear el pago en PayPal.'
      });
    }

    const approvalUrl = data.links?.find((link) => link.rel === 'approve')?.href;
    if (!approvalUrl) {
      return json(res, 502, { error: 'PayPal no devolvió enlace de aprobación.' });
    }

    return json(res, 200, {
      orderId: data.id,
      reference,
      approvalUrl,
      amount,
      currency
    });
  } catch (error) {
    return json(res, 500, { error: error.message || 'No se pudo crear el checkout de PayPal.' });
  }
};
