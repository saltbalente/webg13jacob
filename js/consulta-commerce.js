(() => {
  const WHATSAPP_NUMBER = '12253607317';
  const CONSULTA_AMOUNT_COP = 40000;
  const CONSULTA_AMOUNT_CENTS = CONSULTA_AMOUNT_COP * 100;
  const CONSULTA_AMOUNT_USD = '10.00';
  const CONSULTA_USD_LABEL = 'USD $10';
  const PAYPAL_EMAIL = 'saludablebela@gmail.com';
  const COP_LABEL = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(CONSULTA_AMOUNT_COP);

  const PAID_ACCESS_KEY = 'jacob_consulta_payment_approved';
  const PROFILE_KEY = 'jacob_consulta_customer';
  const $ = (selector) => document.querySelector(selector);

  function getPaidAccess() {
    try {
      const raw = sessionStorage.getItem(PAID_ACCESS_KEY) || localStorage.getItem(PAID_ACCESS_KEY);
      if (!raw) return null;
      const access = JSON.parse(raw);
      if (!access?.approvedAt) return null;
      const approvedAt = new Date(access.approvedAt).getTime();
      const maxAgeMs = 1000 * 60 * 60 * 24 * 7;
      if (!Number.isFinite(approvedAt) || Date.now() - approvedAt > maxAgeMs) return null;
      return access;
    } catch (_error) {
      return null;
    }
  }

  function savePaidAccess(reference, transactionId) {
    const access = JSON.stringify({
      reference: reference || '',
      transactionId: transactionId || '',
      approvedAt: new Date().toISOString()
    });
    sessionStorage.setItem(PAID_ACCESS_KEY, access);
    localStorage.setItem(PAID_ACCESS_KEY, access);
  }

  function gateDirectWhatsAppButtons() {
    if (getPaidAccess()) return;
    document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"], .phone-container, .whatsapp-form, #whatsapp-container').forEach((element) => {
      if (element.id === 'consulta-whatsapp-link') return;
      element.hidden = true;
      element.setAttribute('aria-hidden', 'true');
    });
  }

  function setText(selector, value) {
    const node = $(selector);
    if (node) node.textContent = value;
  }

  function escapeText(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char]));
  }

  function showStatus(message, type = 'info') {
    const status = $('#consulta-status');
    if (!status) return;
    status.textContent = message;
    status.className = `consulta-status consulta-status--${type}`;
    status.hidden = false;
  }

  function getSelectedPaymentMethod(form) {
    return form.querySelector('[name="paymentMethod"]:checked')?.value || 'wompi';
  }

  function updatePaymentMethodUI(form) {
    const method = getSelectedPaymentMethod(form);
    form.querySelectorAll('.consulta-payment-option').forEach((option) => {
      const checked = option.querySelector('input')?.checked;
      option.classList.toggle('is-selected', Boolean(checked));
    });
    const buttonText = form.querySelector('[data-payment-button-text]');
    if (buttonText) {
      buttonText.textContent = method === 'paypal'
        ? 'Pagar consulta segura con PayPal'
        : 'Pagar consulta segura con Wompi';
    }
  }

  function createPaymentReference(method) {
    const prefix = method === 'paypal' ? 'JACOB-PAYPAL' : 'JACOB-WOMPI';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  function buildPayPalCheckoutUrl(profile, reference) {
    const returnUrl = new URL('/consulta-confirmacion.html', window.location.origin);
    returnUrl.searchParams.set('provider', 'paypal');
    returnUrl.searchParams.set('ref', reference);

    const cancelUrl = new URL('/consulta.html', window.location.origin);
    cancelUrl.searchParams.set('payment', 'cancelled');

    const paypalUrl = new URL('https://www.paypal.com/cgi-bin/webscr');
    paypalUrl.searchParams.set('cmd', '_xclick');
    paypalUrl.searchParams.set('business', PAYPAL_EMAIL);
    paypalUrl.searchParams.set('item_name', 'Consulta privada Maestro Jacob');
    paypalUrl.searchParams.set('item_number', reference);
    paypalUrl.searchParams.set('amount', CONSULTA_AMOUNT_USD);
    paypalUrl.searchParams.set('currency_code', 'USD');
    paypalUrl.searchParams.set('no_shipping', '1');
    paypalUrl.searchParams.set('return', returnUrl.toString());
    paypalUrl.searchParams.set('cancel_return', cancelUrl.toString());
    paypalUrl.searchParams.set('custom', JSON.stringify({
      reference,
      name: profile.customerName || '',
      phone: profile.customerPhone || ''
    }));
    return paypalUrl.toString();
  }

  function initCheckoutPage() {
    const form = $('#consulta-payment-form');
    if (!form) return;

    setText('[data-consulta-price-usd]', CONSULTA_USD_LABEL);
    setText('[data-consulta-price-cop]', COP_LABEL);

    updatePaymentMethodUI(form);
    form.querySelectorAll('[name="paymentMethod"]').forEach((input) => {
      input.addEventListener('change', () => updatePaymentMethodUI(form));
    });
    form.querySelectorAll('.consulta-payment-option').forEach((option) => {
      option.addEventListener('click', () => {
        const input = option.querySelector('[name="paymentMethod"]');
        if (!input) return;
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submitButton = form.querySelector('button[type="submit"]');
      const buttonText = form.querySelector('[data-payment-button-text]');
      const formData = new FormData(form);
      const paymentMethod = getSelectedPaymentMethod(form);
      const payload = {
        customerName: formData.get('customerName'),
        customerEmail: formData.get('customerEmail'),
        customerPhone: formData.get('customerPhone')
      };
      const profile = {
        ...payload,
        birthDate: formData.get('birthDate'),
        paymentMethod
      };

      try {
        if (submitButton) {
          submitButton.disabled = true;
        }
        if (buttonText) {
          buttonText.textContent = paymentMethod === 'paypal'
            ? 'Abriendo PayPal seguro...'
            : 'Creando pago seguro en Wompi...';
        }

        sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        sessionStorage.setItem('jacob_consulta_payment_method', paymentMethod);

        if (paymentMethod === 'paypal') {
          const reference = createPaymentReference('paypal');
          sessionStorage.setItem('jacob_consulta_reference', reference);
          showStatus(`Abriendo PayPal para pagar ${CONSULTA_USD_LABEL} a ${PAYPAL_EMAIL}...`, 'info');
          window.location.href = buildPayPalCheckoutUrl(profile, reference);
          return;
        }

        showStatus('Conectando con Wompi para crear el pago seguro...', 'info');

        const response = await fetch('/api/wompi-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.checkoutUrl) {
          throw new Error(data.error || 'No se pudo crear el pago en Wompi.');
        }

        sessionStorage.setItem('jacob_consulta_reference', data.reference || '');
        window.location.href = data.checkoutUrl;
      } catch (error) {
        showStatus(error.message || 'No se pudo iniciar el pago. Intenta de nuevo.', 'error');
        if (submitButton) {
          submitButton.disabled = false;
        }
        if (buttonText) {
          updatePaymentMethodUI(form);
        }
      }
    });
  }

  function getConfirmationParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      reference: params.get('ref') || params.get('reference') || sessionStorage.getItem('jacob_consulta_reference') || '',
      transactionId: params.get('id') || params.get('transaction_id') || '',
      provider: params.get('provider') || params.get('payment_method') || sessionStorage.getItem('jacob_consulta_payment_method') || 'wompi'
    };
  }

  async function fetchTransaction(transactionId) {
    if (!transactionId) return null;
    const response = await fetch(`https://production.wompi.co/v1/transactions/${encodeURIComponent(transactionId)}`);
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.data || null;
  }

  function showPanel(id) {
    document.querySelectorAll('[data-confirmation-panel]').forEach((panel) => {
      panel.hidden = panel.id !== id;
    });
  }

  function transactionIsApproved(transaction, reference) {
    if (!transaction || transaction.status !== 'APPROVED') return false;
    if (reference && transaction.reference !== reference) return false;
    if (Number(transaction.amount_in_cents) !== CONSULTA_AMOUNT_CENTS) return false;
    return true;
  }

  function buildWhatsAppMessage(formData, reference, transactionId) {
    const name = formData.get('fullName');
    const birthDate = formData.get('birthDate');
    const email = formData.get('customerEmail');
    const phone = formData.get('customerPhone');
    const reason = formData.get('consultReason');
    const customer = JSON.parse(sessionStorage.getItem(PROFILE_KEY) || '{}');

    return [
      'Hola Maestro Jacob, ya realicé el pago de la consulta privada.',
      '',
      `Referencia de pago: ${reference || 'pendiente'}`,
      transactionId ? `Transacción: ${transactionId}` : '',
      `Nombre: ${name}`,
      `Fecha de nacimiento: ${birthDate}`,
      `Correo: ${email || customer.customerEmail || ''}`,
      `WhatsApp de contacto: ${phone || customer.customerPhone || ''}`,
      '',
      'Motivo de consulta:',
      reason
    ].filter(Boolean).join('\n');
  }

  function initApprovedConsultationForm(reference, transactionId) {
    const form = $('#consulta-after-payment-form');
    const whatsappLink = $('#consulta-whatsapp-link');
    if (!form || !whatsappLink) return;

    const customer = JSON.parse(sessionStorage.getItem(PROFILE_KEY) || '{}');
    const fieldMap = {
      fullName: customer.customerName,
      birthDate: customer.birthDate,
      customerEmail: customer.customerEmail,
      customerPhone: customer.customerPhone
    };
    Object.entries(fieldMap).forEach(([name, value]) => {
      const field = form.querySelector(`[name="${name}"]`);
      if (field && value && !field.value) field.value = value;
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const message = buildWhatsAppMessage(formData, reference, transactionId);
      whatsappLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      whatsappLink.hidden = false;
      whatsappLink.focus();
      showStatus('Datos listos. Toca el botón de WhatsApp para enviar la consulta al maestro.', 'success');
    });
  }

  async function initConfirmationPage() {
    if (!$('#consulta-confirmation-page')) return;

    const { reference, transactionId, provider } = getConfirmationParams();
    setText('[data-consulta-reference]', reference || 'No recibida');
    setText('[data-consulta-amount]', `${CONSULTA_USD_LABEL} (${COP_LABEL})`);

    if (provider === 'paypal' && !transactionId) {
      showPanel('consulta-pending-panel');
      showStatus(`Si ya pagaste por PayPal a ${PAYPAL_EMAIL}, guarda la referencia ${reference || 'generada'} y espera la confirmación manual del pago.`, 'info');
      return;
    }

    if (!transactionId) {
      showPanel('consulta-pending-panel');
      showStatus('Wompi todavía no envió el ID de transacción. Si ya pagaste, vuelve desde el comprobante de Wompi para completar la validación.', 'info');
      return;
    }

    try {
      const transaction = await fetchTransaction(transactionId);
      if (transactionIsApproved(transaction, reference)) {
        const approvedReference = reference || transaction.reference;
        savePaidAccess(approvedReference, transactionId);
        showPanel('consulta-approved-panel');
        initApprovedConsultationForm(approvedReference, transactionId);
        showStatus('Pago aprobado y validado. Ahora completa los datos de consulta.', 'success');
        return;
      }

      if (transaction?.status === 'DECLINED' || transaction?.status === 'VOIDED' || transaction?.status === 'ERROR') {
        showPanel('consulta-declined-panel');
        showStatus(`Wompi reportó el pago como ${escapeText(transaction.status)}. Puedes intentar nuevamente.`, 'error');
        return;
      }

      showPanel('consulta-pending-panel');
      showStatus('El pago aún está pendiente en Wompi. Actualiza esta página en unos minutos.', 'info');
    } catch (error) {
      showPanel('consulta-pending-panel');
      showStatus('No se pudo validar la transacción en este momento. Actualiza la página para intentar validar el pago nuevamente.', 'error');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    gateDirectWhatsAppButtons();
    initCheckoutPage();
    initConfirmationPage();
  });
})();
