const crypto = require('node:crypto');

const DEFAULT_AMOUNT_COP = 40000; // USD $10 reference at 4,000 COP/USD.
const DEFAULT_CURRENCY = 'COP';
const DEFAULT_PRODUCT_NAME = 'Consulta espiritual privada con el Maestro Jacob';

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

function createReference() {
  return `JACOB-CONSULTA-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function signIntegrity(reference, amountInCents, currency, integritySecret) {
  return crypto
    .createHash('sha256')
    .update(`${reference}${amountInCents}${currency}${integritySecret}`)
    .digest('hex');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Método no permitido' });
  }

  try {
    const publicKey = process.env.WOMPI_PUBLIC_KEY;
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;

    if (!publicKey || !integritySecret) {
      return json(res, 500, {
        error: 'Wompi no está configurado todavía. Faltan WOMPI_PUBLIC_KEY o WOMPI_INTEGRITY_SECRET.'
      });
    }

    const body = await readBody(req);
    const customerName = safeText(body.customerName, 100);
    const customerEmail = safeText(body.customerEmail, 180).toLowerCase();
    const customerPhone = safeText(body.customerPhone, 40);

    if (customerName.length < 2 || !/^\S+@\S+\.\S+$/.test(customerEmail) || customerPhone.length < 5) {
      return json(res, 400, { error: 'Nombre, correo y WhatsApp son obligatorios para iniciar el pago.' });
    }

    const amountCop = Number(process.env.CONSULTA_AMOUNT_COP || DEFAULT_AMOUNT_COP);
    const currency = process.env.WOMPI_CURRENCY || DEFAULT_CURRENCY;
    const amountInCents = Math.round(amountCop * 100);
    const reference = createReference();
    const signature = signIntegrity(reference, amountInCents, currency, integritySecret);
    const origin = getOrigin(req);

    const params = new URLSearchParams({
      'public-key': publicKey,
      currency,
      'amount-in-cents': String(amountInCents),
      reference,
      'signature:integrity': signature,
      'customer-data:email': customerEmail,
      'customer-data:full-name': customerName,
      'customer-data:phone-number': customerPhone,
      'redirect-url': `${origin}/consulta-confirmacion.html?ref=${encodeURIComponent(reference)}`,
      'customer-data:legal-id': '000000000',
      'customer-data:legal-id-type': 'CC'
    });

    return json(res, 200, {
      checkoutUrl: `https://checkout.wompi.co/p/?${params.toString()}`,
      reference,
      productName: DEFAULT_PRODUCT_NAME,
      amountCop,
      amountInCents,
      currency
    });
  } catch (error) {
    return json(res, 500, { error: error.message || 'No se pudo crear el checkout.' });
  }
};
