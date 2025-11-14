import { toast } from './toast.js';

let state = {
  page: 1,
  pageSize: 20,
  products: [],
  filtered: [],
  editingId: null,
  sortBy: 'id',
  sortDir: 'asc'
};

function applyAcl() {
  // Usa localStorage para recuperar o papel do usuário (padrão do projeto)
  let role = null, name = '';
  try {
    const raw = localStorage.getItem('user');
    if (raw) { const u = JSON.parse(raw); role = u.role; name = u.name || ''; }
  } catch {}
  const roleSpan = document.querySelector('#user-role-display');
  if (roleSpan) roleSpan.textContent = role || '';
  const nameEl = document.querySelector('#atendente-nome');
  if (nameEl) nameEl.textContent = name;

  const nav = document.querySelector('#admin-nav');
  if (nav && role && role !== 'admin') {
    const usersTab = nav.querySelector('a[href="/admin/usuarios"]');
    if (usersTab) usersTab.classList.add('hidden');
    const logsTab = nav.querySelector('a[href="/admin/logs"]');
    if (logsTab) logsTab.classList.add('hidden');
  }
}

async function fetchProducts() {
  try {
    const res = await fetch('/api/produtos/admin');
    if (!res.ok) throw new Error('Falha ao carregar produtos');
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.products || []);
    state.products = list;
    state.filtered = state.products;
    render();
  } catch (err) {
    console.error(err);
    toast.error('Erro ao buscar produtos.');
  }
}

function paginate(list) {
  const start = (state.page - 1) * state.pageSize;
  return list.slice(start, start + state.pageSize);
}

function render() {
  const tbody = document.querySelector('#admin-products-body');
  const summary = document.querySelector('#admin-products-summary');
  if (!tbody) return;

  // Ordenar antes de paginar
  const sorted = [...state.filtered].sort((a, b) => {
    let aVal = a[state.sortBy];
    let bVal = b[state.sortBy];
    const dir = state.sortDir === 'asc' ? 1 : -1;
    
    // Mapear campos
    if (state.sortBy === 'name') { aVal = a.name; bVal = b.name; }
    else if (state.sortBy === 'price') { aVal = Number(a.price); bVal = Number(b.price); }
    else if (state.sortBy === 'stock') { aVal = Number(a.stock); bVal = Number(b.stock); }
    else if (state.sortBy === 'available') { 
      aVal = (a.available === 'S' || a.available === true) ? 1 : 0; 
      bVal = (b.available === 'S' || b.available === true) ? 1 : 0;
    }
    
    if (typeof aVal === 'number') return (aVal - bVal) * dir;
    return String(aVal || '').localeCompare(String(bVal || '')) * dir;
  });

  const rows = paginate(sorted).map((p) => {
    const disponivel = p.available === 'S' || p.available === true || p.available === 'true';
    const estoque = Number(p.stock ?? 0);
    const valor = Number(p.price ?? 0);
    const alertIcon = (disponivel && estoque === 0) ? '<span title="Disponível mas sem estoque!" class="inline-flex items-center mr-2 text-red-600">⚠️</span>' : '';
    return `
      <tr class="border-t">
        <td class="p-2 text-gray-500">${p.id ?? ''}</td>
        <td class="p-2">${alertIcon}${p.name ?? ''}</td>
        <td class="p-2">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)}</td>
        <td class="p-2">${estoque}</td>
        <td class="p-2">
          <span class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${disponivel ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}">
            ${disponivel ? 'Disponível' : 'Indisponível'}
          </span>
        </td>
        <td class="p-2">
          <button class="px-2 py-1 text-blue-600 hover:underline" data-action="edit" data-id="${p.id}">Editar</button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = rows || '<tr><td colspan="6" class="p-3 text-center text-gray-500">Nenhum produto encontrado.</td></tr>';

  if (summary) {
    const total = state.filtered.length;
    const start = total ? (state.page - 1) * state.pageSize + 1 : 0;
    const end = Math.min(state.page * state.pageSize, total);
    summary.textContent = total ? `Exibindo ${start}-${end} de ${total}` : 'Sem resultados';
  }
  
  updateSortIndicators();
}

function bindTableActions() {
  const tbody = document.querySelector('#admin-products-body');
  if (!tbody) return;
  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const action = btn.getAttribute('data-action');
    if (action === 'edit') onEdit(id);
  });
}

function setupSearch() {
  const input = document.querySelector('#product-search');
  const btn = document.querySelector('#product-search-btn');
  const clear = document.querySelector('#product-clear-btn');
  const run = () => {
    const q = (input?.value || '').toLowerCase().trim();
    state.page = 1;
    if (!q) {
      state.filtered = state.products;
    } else {
      state.filtered = state.products.filter(p => (p.name || '').toLowerCase().includes(q));
    }
    render();
  };
  if (btn) btn.addEventListener('click', run);
  if (input) input.addEventListener('keyup', (e) => { if (e.key === 'Enter') run(); });
  if (clear) clear.addEventListener('click', () => { if (input) input.value = ''; run(); });
}

function setupPaging() {
  const prev = document.querySelector('#products-page-prev');
  const next = document.querySelector('#products-page-next');
  if (prev) prev.addEventListener('click', () => { if (state.page > 1) { state.page--; render(); } });
  if (next) next.addEventListener('click', () => {
    const max = Math.ceil(state.filtered.length / state.pageSize) || 1;
    if (state.page < max) { state.page++; render(); }
  });
}

function openModal(mode, product) {
  const dlg = document.querySelector('#product-modal');
  const title = document.querySelector('#product-modal-title');
  const nome = document.querySelector('#prod-nome');
  const desc = document.querySelector('#prod-descricao');
  const valor = document.querySelector('#prod-valor');
  const estoque = document.querySelector('#prod-estoque');
  const disp = document.querySelector('#prod-disponivel');

  state.editingId = mode === 'edit' ? (product?.id) : null;

  if (title) title.textContent = mode === 'edit' ? 'Editar Produto' : 'Novo Produto';
  if (nome) nome.value = product?.name ?? '';
  if (desc) desc.value = product?.description ?? '';
  if (valor) valor.value = product?.price ?? '';
  if (estoque) estoque.value = product?.stock ?? '';
  if (disp) disp.checked = (product?.available === 'S' || product?.available === true);

  if (dlg && !dlg.open) dlg.showModal();
}

function closeModal() {
  const dlg = document.querySelector('#product-modal');
  if (dlg && dlg.open) dlg.close();
}

function bindModal() {
  const cancel = document.querySelector('#prod-cancel');
  const save = document.querySelector('#prod-save');
  if (cancel) cancel.addEventListener('click', () => closeModal());
  if (save) save.addEventListener('click', onSave);
}

function onAdd() {
  openModal('add', null);
}

function onEdit(id) {
  const p = state.products.find(x => String(x.id) === String(id));
  if (!p) return;
  openModal('edit', p);
}

async function onSave() {
  const nome = document.querySelector('#prod-nome')?.value?.trim();
  const descricao = document.querySelector('#prod-descricao')?.value?.trim();
  const valorStr = document.querySelector('#prod-valor')?.value;
  const estoqueStr = document.querySelector('#prod-estoque')?.value;
  const disponivel = document.querySelector('#prod-disponivel')?.checked;

  if (!nome) { toast.warn('Informe o nome.'); return; }
  const valor = Number(valorStr || 0);
  const qtde_estoque = Number(estoqueStr || 0);
  const body = { nome, descricao, valor, qtde_estoque, disponivel: disponivel ? 'S' : 'N' };

  try {
    if (state.editingId) {
      const res = await fetch(`/api/produtos/${state.editingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Falha ao atualizar');
      toast.success('Produto atualizado.');
    } else {
      const res = await fetch('/api/produtos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Falha ao criar');
      toast.success('Produto criado.');
    }
    closeModal();
    await fetchProducts();
  } catch (err) {
    console.error(err);
    toast.error('Erro ao salvar produto.');
  }
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
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (state.sortBy === field) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortBy = field;
        state.sortDir = 'asc';
      }
      render();
    });
  });
}

function wireHeader() {
  document.querySelector('#logout-button')?.addEventListener('click', () => {
    localStorage.removeItem('user');
    location.href = '/login';
  });
  document.querySelector('#btn-back')?.addEventListener('click', () => {
    history.length > 1 ? history.back() : (location.href = '/admin/usuarios');
  });
}

async function init() {
  applyAcl();
  wireHeader();
  setupSearch();
  setupPaging();
  bindTableActions();
  bindModal();
  setupSortHeaders();
  document.querySelector('#product-add-btn')?.addEventListener('click', onAdd);
  await fetchProducts();
}

init();
