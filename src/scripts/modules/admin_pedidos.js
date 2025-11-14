import { toast } from './toast.js';

let state = { page: 1, pageSize: 20, search: '', clientId: '', status: '' };

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
  tbody.innerHTML = rows.map(r => `
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
      <td class="p-2">${r.created_at ? new Date(r.created_at).toLocaleString('pt-BR') : '-'}</td>
      <td class="p-2"><button class="text-blue-600 hover:underline btn-save-order" data-order-id="${r.id}">Salvar</button></td>
    </tr>
  `).join('');

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
}

async function reload() {
  const data = await fetchOrders();
  renderOrders(data);
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
    state = { page: 1, pageSize: 20, search: '', clientId: '', status: '' };
    await reload();
  });
  document.getElementById('orders-page-prev')?.addEventListener('click', async () => {
    if (state.page > 1) { state.page -= 1; await reload(); }
  });
  document.getElementById('orders-page-next')?.addEventListener('click', async () => {
    state.page += 1; await reload();
  });

  reload();
}

document.addEventListener('DOMContentLoaded', init);
