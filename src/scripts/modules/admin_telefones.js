import { toast } from './toast.js';
import { Utils } from './utils.js';

let state = { page: 1, pageSize: 20, search: '', sortBy: 'id', sortDir: 'asc' };

async function fetchPhones() {
  const params = new URLSearchParams();
  params.set('page', String(state.page));
  params.set('pageSize', String(state.pageSize));
  if (state.search) params.set('search', state.search);
  const resp = await fetch(`/api/telefones?${params.toString()}`);
  if (!resp.ok) throw new Error('Erro ao buscar telefones');
  return await resp.json();
}

function renderPhones({ rows, page, pageSize, total }) {
  const tbody = document.getElementById('admin-phones-body');
  const summary = document.getElementById('admin-phones-summary');
  
  // Ordenar localmente
  const sorted = [...rows].sort((a, b) => {
    const aVal = a[state.sortBy];
    const bVal = b[state.sortBy];
    const dir = state.sortDir === 'asc' ? 1 : -1;
    if (typeof aVal === 'number') return (aVal - bVal) * dir;
    return String(aVal || '').localeCompare(String(bVal || '')) * dir;
  });
  
  tbody.innerHTML = sorted.map(r => `
    <tr class="border-b">
      <td class="p-2">${r.id}</td>
      <td class="p-2">${r.numero}</td>
      <td class="p-2">${r.client_name} <span class="text-xs text-gray-500">(#${r.client_id})</span></td>
      <td class="p-2">
        <button class="text-blue-600 hover:underline" data-action="edit" data-id="${r.id}" data-numero="${r.numero}">Editar</button>
        <span class="text-gray-300 mx-1">|</span>
        <button class="text-red-600 hover:underline" data-action="delete" data-id="${r.id}">Apagar</button>
      </td>
    </tr>`).join('');
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  summary.textContent = total ? `${start}-${end} de ${total}` : '0 resultados';

  tbody.querySelectorAll('button[data-action]')?.forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      const id = Number(btn.dataset.id);
      if (action === 'delete') {
        const confirmed = await toast.confirm(
          'Apagar telefone',
          'Tem certeza que deseja remover este telefone? Esta ação não pode ser desfeita.',
          { confirmText: 'Apagar', cancelText: 'Cancelar' }
        );
        if (!confirmed) return;
        const resp = await fetch(`/api/telefones/${id}`, { method: 'DELETE' });
        if (!resp.ok) { toast.error('Falha ao apagar'); return; }
        toast.success('Telefone apagado!');
        await reload();
      } else if (action === 'edit') {
        openEditModal(id, btn.dataset.numero || '');
      }
    });
  });
}

function openEditModal(phoneId, currentNumber) {
  const dialog = /** @type {HTMLDialogElement|null} */ (document.getElementById('edit-phone-modal'));
  const inputNumber = document.getElementById('edit-phone-modal-number');
  const btnCancel = document.getElementById('edit-phone-cancel');
  const btnConfirm = document.getElementById('edit-phone-confirm');

  if (!dialog || !inputNumber) return;

  // Preencher com valor atual formatado
  inputNumber.value = Utils.formatPhone(currentNumber);

  // Máscara de telefone no input
  inputNumber.oninput = (e) => {
    const el = e.target;
    const oldValue = el.value;
    const oldCursor = el.selectionStart;
    const formatted = Utils.formatPhone(oldValue);
    el.value = formatted;
    const digitsBefore = Utils.onlyDigits(oldValue.substring(0, oldCursor || 0)).length;
    let newCursor = 0, count = 0;
    for (let i = 0; i < formatted.length && count < digitsBefore; i++) {
      if (/\d/.test(formatted[i])) count++;
      newCursor = i + 1;
    }
    el.setSelectionRange(newCursor, newCursor);
  };

  // Botão cancelar
  btnCancel.onclick = () => {
    dialog.close();
  };

  // Botão confirmar
  btnConfirm.onclick = async () => {
    const numero = inputNumber.value.trim();
    if (!numero) {
      toast.warning('Informe o novo número');
      return;
    }
    try {
      const resp = await fetch(`/api/telefones/${phoneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero })
      });
      if (!resp.ok) throw new Error('Falha ao atualizar');
      toast.success('Telefone atualizado!');
      dialog.close();
      await reload();
    } catch (e) {
      toast.error(e.message || 'Erro ao atualizar telefone');
    }
  };

  try {
    dialog.showModal();
  } catch {}
}

function init() {
  const backBtn = document.getElementById('btn-back');
  if (backBtn) backBtn.onclick = () => { window.location.href = '/atendimento/idle'; };

  document.getElementById('phone-search-btn')?.addEventListener('click', async () => {
    state.search = document.getElementById('phone-search').value.trim();
    state.page = 1;
    await reload();
  });
  document.getElementById('phone-clear-btn')?.addEventListener('click', async () => {
    const inp = document.getElementById('phone-search');
    if (inp) inp.value = '';
    state.search = '';
    state.page = 1;
    await reload();
  });
  document.getElementById('phones-page-prev')?.addEventListener('click', async () => {
    if (state.page > 1) { state.page -= 1; await reload(); }
  });
  document.getElementById('phones-page-next')?.addEventListener('click', async () => {
    state.page += 1; await reload();
  });

  // Abrir modal de adicionar telefone
  const openBtn = document.getElementById('btn-open-add-phone');
  const dialog = /** @type {HTMLDialogElement|null} */ (document.getElementById('add-phone-modal'));
  const inputClient = document.getElementById('add-phone-modal-client');
  const inputNumber = document.getElementById('add-phone-modal-number');
  const btnCancel = document.getElementById('add-phone-cancel');
  const btnConfirm = document.getElementById('add-phone-confirm');

  function resetModal() {
    if (inputClient) inputClient.value = '';
    if (inputNumber) inputNumber.value = '';
  }

  if (openBtn && dialog) {
    openBtn.addEventListener('click', () => {
      resetModal();
      try { dialog.showModal(); } catch {}
    });
  }
  if (inputNumber) {
    inputNumber.addEventListener('input', (e) => {
      const el = e.target;
      const oldValue = el.value;
      const oldCursor = el.selectionStart;
      const formatted = Utils.formatPhone(oldValue);
      el.value = formatted;
      const digitsBefore = Utils.onlyDigits(oldValue.substring(0, oldCursor || 0)).length;
      let newCursor = 0, count = 0;
      for (let i = 0; i < formatted.length && count < digitsBefore; i++) {
        if (/\d/.test(formatted[i])) count++;
        newCursor = i + 1;
      }
      el.setSelectionRange(newCursor, newCursor);
    });
  }
  if (btnCancel && dialog) {
    btnCancel.addEventListener('click', () => {
      dialog.close();
      toast.info('Inserção cancelada.');
    });
  }
  if (btnConfirm && dialog) {
    btnConfirm.addEventListener('click', async () => {
      const clientId = Number(inputClient?.value || '');
      const numero = inputNumber?.value?.trim();
      if (!clientId || !numero) { toast.warning('Informe ID do cliente e número'); return; }
      try {
        const resp = await fetch('/api/telefones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: clientId, numero }) });
        if (!resp.ok) throw new Error('Falha ao adicionar');
        toast.success('Telefone adicionado!');
        dialog.close();
        await reload();
      } catch (e) {
        toast.error(e.message || 'Erro ao adicionar telefone');
      }
    });
  }

  setupSortHeaders();
  reload();
}

async function reload() {
  const data = await fetchPhones();
  renderPhones(data);
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

document.addEventListener('DOMContentLoaded', init);
