import { toast } from './toast.js';

let state = { page: 1, pageSize: 20, search: '', clientId: '', status: '', sortBy: 'id', sortDir: 'desc' };

async function fetchOrders() {
  const params = new URLSearchParams();
  params.set('page', String(state.page));
  params.set('pageSize', String(state.pageSize));
  if (state.search) params.set('search', state.search);
  if (state.clientId) params.set('clientId', String(state.clientId));
  if (state.status) params.set('status', state.status);
  const resp = await fetch(`/api/pedidos?${params.toString()}`);
  if (!resp.ok) throw new Error('Erro ao buscar pedidos');
  return await resp.json();
}

function renderOrders({ rows, page, pageSize, total }) {
  const tbody = document.getElementById('admin-orders-body');
  const summary = document.getElementById('admin-orders-summary');
  
  // Ordenar localmente
  const sorted = [...rows].sort((a, b) => {
    let aVal = a[state.sortBy];
    let bVal = b[state.sortBy];
    const dir = state.sortDir === 'asc' ? 1 : -1;
    
    // Tratamento especial para data
    if (state.sortBy === 'created_at') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }
    
    if (typeof aVal === 'number') return (aVal - bVal) * dir;
    return String(aVal || '').localeCompare(String(bVal || '')) * dir;
  });
  
  tbody.innerHTML = sorted.map(r => {
    const valorTotal = Number(r.valor_total || 0);
    const valorFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal);
    return `
    <tr class="border-b">
      <td class="p-2">#${r.id}</td>
      <td class="p-2">${r.client_name} <span class="text-xs text-gray-500">(#${r.client_id})</span></td>
      <td class="p-2">${r.phone || '-'}</td>
      <td class="p-2">
        <select class="border rounded px-2 py-1" data-order-id="${r.id}">
          ${['Pendente','Em andamento','Entregue','Cancelado'].map(s => `<option ${s===r.status?'selected':''}>${s}</option>`).join('')}
        </select>
      </td>
      <td class="p-2">${r.payment_method || '-'}</td>
      <td class="p-2 font-medium text-gray-900">${valorFormatted}</td>
      <td class="p-2">${r.created_at ? new Date(r.created_at).toLocaleString('pt-BR') : '-'}</td>
      <td class="p-2">
        <button class="text-blue-600 hover:underline btn-save-order" data-order-id="${r.id}">Salvar</button>
        <span class="text-gray-300 mx-1">|</span>
        <button class="text-green-600 hover:underline btn-details-order" data-order-id="${r.id}">Detalhes</button>
      </td>
    </tr>
  `;
  }).join('');

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  summary.textContent = total ? `${start}-${end} de ${total}` : '0 resultados';

  tbody.querySelectorAll('.btn-save-order').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.getAttribute('data-order-id'));
      const row = btn.closest('tr');
      const select = row ? row.querySelector('select') : null;
      const status = select ? select.value : '';
      if (!id || !status) { toast.warning('Seleção inválida'); return; }
      try {
        const resp = await fetch(`/api/pedidos/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
        if (!resp.ok) throw new Error('Falha ao salvar');
        toast.success('Status do pedido atualizado!');
      } catch (e) {
        toast.error(e.message || 'Erro ao atualizar status');
      }
    });
  });

  tbody.querySelectorAll('.btn-details-order').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.getAttribute('data-order-id'));
      await showOrderDetails(id);
    });
  });
}

async function showOrderDetails(orderId) {
  try {
    // Buscar detalhes do pedido via API (reutilizar endpoint de atendimento se disponível ou criar novo)
    const resp = await fetch(`/api/pedidos/${orderId}/detalhes`);
    if (!resp.ok) throw new Error('Erro ao buscar detalhes');
    const { order } = await resp.json();

    const dialog = document.getElementById('order-details-modal');
    const body = document.getElementById('order-details-body');
    if (!dialog || !body) return;

    const valorTotal = Number(order.valor_total || 0);
    const computedSum = (order.items || []).reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.quantity || 0)), 0);
    const valorFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal);
    const computedFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(computedSum);
    const endereco = [order.logradouro, order.numero, order.bairro].filter(Boolean).join(', ') || '-';
    const complemento = order.complemento ? `Compl: ${order.complemento}` : '';
    const ponto_ref = order.ponto_ref ? `Ref: ${order.ponto_ref}` : '';

    const itemsHtml = (order.items || []).map(it => {
      const preco = Number(it.price || 0);
      const precoFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(preco);
      const subtotal = preco * it.quantity;
      const subtotalFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal);
      return `
        <li class="flex justify-between items-center py-2 border-b">
          <div>
            <span class="font-medium">${it.product}</span>
            <span class="text-xs text-gray-500 ml-2">(${it.quantity}x ${precoFormatted})</span>
          </div>
          <span class="font-semibold">${subtotalFormatted}</span>
        </li>
      `;
    }).join('');

    body.innerHTML = `
      <div class="space-y-4">
        <div>
          <h4 class="font-semibold text-gray-700 mb-1">Endereço de Entrega</h4>
          <p class="text-sm text-gray-800">${endereco}</p>
          ${complemento ? `<p class="text-xs text-gray-600">${complemento}</p>` : ''}
          ${ponto_ref ? `<p class="text-xs text-gray-600">${ponto_ref}</p>` : ''}
        </div>
        <div>
          <h4 class="font-semibold text-gray-700 mb-2">Produtos</h4>
          <ul class="text-sm">${itemsHtml || '<li class="text-gray-500">Nenhum item</li>'}</ul>
        </div>
        <div class="border-t pt-3 flex justify-between items-center">
          <span class="font-bold text-gray-900">Total do Pedido:</span>
          <span class="font-bold text-lg text-blue-600">${valorFormatted}</span>
        </div>
        ${(valorTotal === 0 && computedSum > 0) ? `<p class="text-sm text-amber-600">Soma dos itens: <strong>${computedFormatted}</strong>. O total do pedido está zerado.</p>` : ''}
      </div>
    `;

    const btnFix = document.getElementById('btn-corrigir-valor');
    if (btnFix) {
      const shouldShow = (valorTotal === 0 && computedSum > 0);
      btnFix.classList.toggle('hidden', !shouldShow);
      btnFix.onclick = null;
      if (shouldShow) {
        btnFix.onclick = async () => {
          try {
            const resp = await fetch(`/api/pedidos/${orderId}/corrigir-valor`, { method: 'PUT' });
            if (!resp.ok) throw new Error('Falha ao corrigir valor');
            const data = await resp.json();
            toast.success(`Valor total corrigido para ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(data.valor_total || 0))}`);
            await reload();
            await showOrderDetails(orderId);
          } catch (e) {
            toast.error(e.message || 'Erro ao corrigir valor');
          }
        };
      }
    }

    dialog.showModal();
  } catch (err) {
    console.error('Erro ao exibir detalhes:', err);
    toast.error('Não foi possível carregar os detalhes do pedido.');
  }
}

async function reload() {
  const data = await fetchOrders();
  renderOrders(data);
  updateSortIndicators();
}

function updateSortIndicators() {
  document.querySelectorAll('th[data-sort]').forEach(th => {
    const indicator = th.querySelector('.sort-indicator');
    if (th.dataset.sort === state.sortBy) {
      indicator.textContent = state.sortDir === 'asc' ? ' ▲' : ' ▼';
    } else {
      indicator.textContent = '';
    }
  });
}

function setupSortHeaders() {
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', async () => {
      const field = th.dataset.sort;
      if (state.sortBy === field) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortBy = field;
        state.sortDir = 'asc';
      }
      await reload();
    });
  });
}

function init() {
  const backBtn = document.getElementById('btn-back');
  if (backBtn) backBtn.onclick = () => { window.location.href = '/atendimento/idle'; };

  document.getElementById('orders-search-btn')?.addEventListener('click', async () => {
    state.search = document.getElementById('orders-search')?.value?.trim() || '';
    state.clientId = document.getElementById('orders-client-id')?.value?.trim() || '';
    state.status = document.getElementById('orders-status-filter')?.value || '';
    state.page = 1;
    await reload();
  });
  document.getElementById('orders-clear-btn')?.addEventListener('click', async () => {
    const s = document.getElementById('orders-search');
    const c = document.getElementById('orders-client-id');
    const f = document.getElementById('orders-status-filter');
    if (s) s.value = '';
    if (c) c.value = '';
    if (f) f.value = '';
    state = { page: 1, pageSize: 20, search: '', clientId: '', status: '', sortBy: state.sortBy, sortDir: state.sortDir };
    await reload();
  });
  document.getElementById('orders-page-prev')?.addEventListener('click', async () => {
    if (state.page > 1) { state.page -= 1; await reload(); }
  });
  document.getElementById('orders-page-next')?.addEventListener('click', async () => {
    state.page += 1; await reload();
  });

  setupSortHeaders();
  reload();
}

document.addEventListener('DOMContentLoaded', init);
