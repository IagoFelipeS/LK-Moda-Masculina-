/* ================================================================
   LK MODAS — Sistema de E-mail com EmailJS
   ✅ Versão com apenas 2 templates (plano gratuito)
   Suas chaves já estão configuradas abaixo — não altere!
================================================================ */

const EMAILJS_CONFIG = {
  PUBLIC_KEY:       'qbslKxM9AwRIg5uYl',
  SERVICE_ID:       'service_m6dj6zx',
  TEMPLATE_LOJISTA: 'template_i9r2b82',
  TEMPLATE_CLIENTE: 'template_wbxbejn',
  LOJISTA_EMAIL:    'lkmodamasculina089@gmail.com',
};

/* ── Initialize ─────────────────────────────────────────────── */
function initEmailJS() {
  if (typeof emailjs === 'undefined') {
    console.warn('EmailJS não carregado.');
    return false;
  }
  emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
  return true;
}

/* ── Helpers ────────────────────────────────────────────────── */
function fmtBRL(v) {
  return 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
}
function fmtDateBR(iso) {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
}
function paymentLabel(m) {
  return { pix: 'Pix', cartao: 'Cartão de Crédito' }[m] || m || '—';
}
function statusLabel(s) {
  return {
    pending:   'Aguardando Pagamento',
    approved:  'Pagamento Aprovado',
    shipped:   'Em Transporte',
    delivered: 'Entregue',
    rejected:  'Pagamento Recusado',
  }[s] || s || '—';
}

/* ── Monta lista de itens como texto simples ────────────────── */
function buildItemsList(items) {
  if (!items || !items.length) return '(sem itens)';
  try {
    const products = Array.isArray(window.__LK_PRODUCTS_CACHE) ? window.__LK_PRODUCTS_CACHE : [];
    return items.map(item => {
      const p    = products.find(pr => String(pr.id) === String(item.id));
      const name = p ? p.name : (item.name || 'Produto #' + item.id);
      const qty  = item.qty || 1;
      const priceVal = p ? p.price * qty : (item.price ? item.price * qty : 0);
      const price = priceVal > 0 ? ' - ' + fmtBRL(priceVal) : '';
      return name + ' x' + qty + price;
    }).join(' | ');
  } catch (e) {
    return items.length + ' item(ns)';
  }
}

/* ================================================================
   📧 TEMPLATE 1 — Novo Pedido → lojista
   Cada campo é uma variável separada no template
================================================================ */
async function sendEmailNovoPedido(order) {
  if (!initEmailJS()) return;
  try {
    await emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_LOJISTA, {
      order_id:         String(order.id || '—'),
      order_date:       fmtDateBR(order.createdAt),
      payment_method:   paymentLabel(order.paymentMethod),
      subtotal:         fmtBRL(order.subtotal || order.total),
      shipping_cost:    order.shippingCost > 0 ? fmtBRL(order.shippingCost) : 'GRÁTIS',
      total:            fmtBRL(order.total),
      items_list:       buildItemsList(order.items),
      customer_name:    String(order.nome     || '—'),
      customer_email:   String(order.email    || '—'),
      customer_phone:   String(order.telefone || '—'),
      delivery_address: String(order.endereco || '—'),
      delivery_city:    String(order.cidade   || '—'),
      delivery_state:   String(order.estado   || '—'),
      delivery_cep:     String(order.cep      || '—'),
      shipping_type:    order.shippingType === 'retirar' ? 'Retirada na loja' : String(order.shippingType || 'PAC').toUpperCase(),
      admin_url:        `${window.location.origin}/admin.html`,
    });
    console.log('✅ E-mail lojista enviado');
  } catch (err) {
    console.error('❌ Erro e-mail lojista:', err);
  }
}

/* ================================================================
   📧 TEMPLATE 2 — Para o CLIENTE
   Campos separados para garantir que aparecem no template
================================================================ */
async function sendEmailCliente(params) {
  if (!initEmailJS()) return;
  if (!params.customer_email || !params.customer_email.includes('@')) {
    console.log('E-mail do cliente inválido:', params.customer_email);
    return;
  }
  try {
    await emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_CLIENTE, params);
    console.log('✅ E-mail cliente enviado para:', params.customer_email);
  } catch (err) {
    console.error('❌ Erro e-mail cliente:', err);
  }
}

/* ── Confirmação de novo pedido ─────────────────────────────── */
async function sendEmailConfirmacaoCliente(order) {
  const pixInfo = order.paymentMethod === 'pix'
    ? 'Chave Pix: +55 16 99360-3482 (Telefone) - Titular: 27.811.253 LEANDRO MARTINZ QUERINO'
    : '';

  await sendEmailCliente({
    // Identificação do cliente
    customer_name:    String(order.nome  || 'Cliente'),
    customer_email:   String(order.email || ''),

    // Assunto dinâmico do e-mail
    email_assunto:    'Pedido ' + order.id + ' recebido',

    // Dados do pedido — cada campo separado
    order_id:         String(order.id || '—'),
    order_date:       fmtDateBR(order.createdAt),
    payment_method:   paymentLabel(order.paymentMethod),
    order_total:      fmtBRL(order.total),
    subtotal:         fmtBRL(order.subtotal || order.total),
    shipping_cost:    order.shippingCost > 0 ? fmtBRL(order.shippingCost) : 'GRÁTIS',
    items_list:       buildItemsList(order.items),

    // Entrega
    delivery_address: String(order.endereco || '—'),
    delivery_city:    String(order.cidade   || '—'),
    delivery_cep:     String(order.cep      || '—'),
    shipping_type:    order.shippingType === 'retirar' ? 'Retirada na loja' : String(order.shippingType || 'PAC').toUpperCase(),

    // Pix
    pix_info:         pixInfo,

    // Links e contato
    tracking_url:     'Acesse o site e vá em Minha Conta para acompanhar seu pedido',
    whatsapp:         '(16) 99360-3482',
    instagram:        '@masculinalkmodas',
  });
}

/* ── Atualização de status ──────────────────────────────────── */
async function sendEmailAtualizacaoStatus(order, newStatus) {
  const mensagens = {
    approved: 'Seu pagamento foi aprovado! Seu pedido já entrou em preparação.',
    shipped:  'Seu pedido foi despachado e está a caminho. Fique atento à entrega!',
    delivered:'Seu pedido foi entregue com sucesso. Aproveite suas peças!',
    rejected: 'Não conseguimos confirmar seu pagamento. Entre em contato pelo WhatsApp (16) 99360-3482.',
  };

  await sendEmailCliente({
    customer_name:    String(order.nome  || 'Cliente'),
    customer_email:   String(order.email || ''),
    email_assunto:    'Atualização do Pedido ' + order.id,
    order_id:         String(order.id || '—'),
    order_date:       fmtDateBR(order.createdAt),
    payment_method:   paymentLabel(order.paymentMethod),
    order_total:      fmtBRL(order.total),
    subtotal:         fmtBRL(order.subtotal || order.total),
    shipping_cost:    order.shippingCost > 0 ? fmtBRL(order.shippingCost) : 'GRÁTIS',
    items_list:       buildItemsList(order.items),
    delivery_address: String(order.endereco || '—'),
    delivery_city:    String(order.cidade   || '—'),
    delivery_cep:     String(order.cep      || '—'),
    shipping_type:    order.shippingType === 'retirar' ? 'Retirada na loja' : String(order.shippingType || 'PAC').toUpperCase(),
    pix_info:         '',
    status_atual:     statusLabel(newStatus),
    status_mensagem:  mensagens[newStatus] || 'Seu pedido foi atualizado.',
    tracking_url:     'Acesse o site e vá em Minha Conta para acompanhar seu pedido',
    whatsapp:         '(16) 99360-3482',
    instagram:        '@masculinalkmodas',
  });
}

/* ── Entradas públicas ──────────────────────────────────────── */
async function notificarNovoPedido(order) {
  await Promise.allSettled([
    sendEmailNovoPedido(order),
    sendEmailConfirmacaoCliente(order),
  ]);
}

async function notificarMudancaStatus(order, newStatus) {
  await sendEmailAtualizacaoStatus(order, newStatus);
}
