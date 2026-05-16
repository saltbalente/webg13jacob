(() => {
  const WHATSAPP_NUMBER = '12253607317';
  const CONSULTA_AMOUNT_COP = 40000;
  const CONSULTA_AMOUNT_CENTS = CONSULTA_AMOUNT_COP * 100;
  const CONSULTA_USD_LABEL = 'USD $10';
  const COP_LABEL = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(CONSULTA_AMOUNT_COP);

  const $ = (selector) => document.querySelector(selector);

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

  function initCheckoutPage() {
    const form = $('#consulta-payment-form');
    if (!form) return;

    setText('[data-consulta-price-usd]', CONSULTA_USD_LABEL);
    setText('[data-consulta-price-cop]', COP_LABEL);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submitButton = form.querySelector('button[type="submit"]');
      const formData = new FormData(form);
      const payload = {
        customerName: formData.get('customerName'),
        customerEmail: formData.get('customerEmail'),
        customerPhone: formData.get('customerPhone')
      };

      try {
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = 'Creando pago seguro...';
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

        sessionStorage.setItem('jacob_consulta_customer', JSON.stringify(payload));
        sessionStorage.setItem('jacob_consulta_reference', data.reference || '');
        window.location.href = data.checkoutUrl;
      } catch (error) {
        showStatus(error.message || 'No se pudo iniciar el pago. Intenta de nuevo.', 'error');
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Pagar consulta segura con Wompi';
        }
      }
    });
  }

  function getConfirmationParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      reference: params.get('ref') || params.get('reference') || sessionStorage.getItem('jacob_consulta_reference') || '',
      transactionId: params.get('id') || params.get('transaction_id') || ''
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
    const reason = formData.get('consultReason');
    const customer = JSON.parse(sessionStorage.getItem('jacob_consulta_customer') || '{}');

    return [
      'Hola Maestro Jacob, ya realicé el pago de la consulta privada.',
      '',
      `Referencia Wompi: ${reference || 'pendiente'}`,
      transactionId ? `Transacción: ${transactionId}` : '',
      `Nombre: ${name}`,
      `Fecha de nacimiento: ${birthDate}`,
      customer.customerPhone ? `WhatsApp de contacto: ${customer.customerPhone}` : '',
      '',
      'Motivo de consulta:',
      reason
    ].filter(Boolean).join('\n');
  }

  function initApprovedConsultationForm(reference, transactionId) {
    const form = $('#consulta-after-payment-form');
    const whatsappLink = $('#consulta-whatsapp-link');
    if (!form || !whatsappLink) return;

    const customer = JSON.parse(sessionStorage.getItem('jacob_consulta_customer') || '{}');
    if (customer.customerName) {
      const nameField = form.querySelector('[name="fullName"]');
      if (nameField && !nameField.value) nameField.value = customer.customerName;
    }

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

    const { reference, transactionId } = getConfirmationParams();
    setText('[data-consulta-reference]', reference || 'No recibida');
    setText('[data-consulta-amount]', `${CONSULTA_USD_LABEL} (${COP_LABEL})`);

    if (!transactionId) {
      showPanel('consulta-pending-panel');
      showStatus('Wompi todavía no envió el ID de transacción. Si ya pagaste, vuelve desde el comprobante de Wompi o escríbenos por WhatsApp con la referencia.', 'info');
      return;
    }

    try {
      const transaction = await fetchTransaction(transactionId);
      if (transactionIsApproved(transaction, reference)) {
        showPanel('consulta-approved-panel');
        initApprovedConsultationForm(reference || transaction.reference, transactionId);
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
      showStatus('No se pudo validar la transacción en este momento. Actualiza la página o escríbenos por WhatsApp con la referencia.', 'error');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initCheckoutPage();
    initConfirmationPage();
  });
})();
