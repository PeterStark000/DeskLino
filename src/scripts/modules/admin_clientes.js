import { toast } from './toast.js';

let state = { page: 1, pageSize: 20, search: '' };

function formatDocument(digits, tipo) {
  if (tipo === 'PF') {
    // CPF: 000.000.000-00
    if (digits.length <= 11) {
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return digits.replace(/(\d{3})(\d+)/, '$1.$2');
      if (digits.length <= 9) return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return digits.substring(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (tipo === 'PJ') {
    // CNPJ: 00.000.000/0000-00
    if (digits.length <= 14) {
      if (digits.length <= 2) return digits;
      if (digits.length <= 5) return digits.replace(/(\d{2})(\d+)/, '$1.$2');
      if (digits.length <= 8) return digits.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
      if (digits.length <= 12) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4');
      return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return digits.substring(0, 14).replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return digits;
}

async function fetchClients() {
  const params = new URLSearchParams();
  params.set('page', String(state.page));
  params.set('pageSize', String(state.pageSize));
  if (state.search) params.set('search', state.search);
  const resp = await fetch(`/api/clientes?${params.toString()}`);
  if (!resp.ok) throw new Error('Erro ao buscar clientes');
  return await resp.json();
}

function renderClients({ rows, page, pageSize, total }) {
  const tbody = document.getElementById('admin-clientes-body');
  const summary = document.getElementById('admin-clientes-summary');
  tbody.innerHTML = rows.map(r => {
    const missingDoc = (!r.cpf && !r.cnpj); // alerta se não possui documento
    const alertIcon = missingDoc ? '<span title="Documento ausente" class="inline-flex items-center mr-2 text-red-600">&#9888;</span>' : '';
    return `
    <tr class="border-b">
      <td class="p-2">${r.id}</td>
      <td class="p-2">${alertIcon}${r.name || '-'}</td>
      <td class="p-2">${r.phone || '-'}</td>
      <td class="p-2">${r.email || '-'}</td>
      <td class="p-2">${r.tipo_cliente || '-'}</td>
      <td class="p-2">
        <button class="text-blue-600 hover:underline" data-action="edit" data-id="${r.id}">Editar</button>
        <span class="text-gray-300 mx-1">|</span>
        <button class="text-red-600 hover:underline" data-action="delete" data-id="${r.id}">Apagar</button>
      </td>
    </tr>`;
  }).join('');
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  summary.textContent = total ? `${start}-${end} de ${total}` : '0 resultados';

  tbody.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => handleRowAction(btn.dataset.action, Number(btn.dataset.id)));
  });
}

async function handleRowAction(action, id) {
  if (action === 'edit') {
    const resp = await fetch(`/api/clientes/id/${id}`);
    if (!resp.ok) { toast.error('Não foi possível buscar o cliente'); return; }
    const { customer } = await resp.json();
    openEditDialog(customer);
  } else if (action === 'delete') {
    const confirmed = await toast.confirm(
      'Apagar cliente',
      'Tem certeza que deseja remover este cliente? Todos os dados associados serão perdidos.',
      { confirmText: 'Apagar', cancelText: 'Cancelar' }
    );
    if (!confirmed) return;
    const resp = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
    if (!resp.ok) {
      const err = await resp.json().catch(()=>({}));
      toast.error(err.error || 'Falha ao apagar');
      return;
    }
    toast.success('Cliente apagado com sucesso!');
    await reload();
  }
}

async function loadAddresses(clientId) {
  const list = document.getElementById('addresses-list');
  if (!list) return;
  list.innerHTML = '<div class="text-sm text-gray-500">Carregando endereços...</div>';
  try {
    const resp = await fetch(`/api/clientes/${clientId}/enderecos`);
    const data = await resp.json();
    const addresses = data.addresses || [];
    if (!addresses.length) {
      list.innerHTML = '<div class="text-sm text-gray-500">Nenhum endereço cadastrado</div>';
      return;
    }
    list.innerHTML = addresses.map(a => `
      <div class="p-3 border rounded-lg flex items-start justify-between gap-3 bg-white">
        <div class="text-sm">
          <p class="font-medium">${a.nome_end || 'Sem apelido'} ${a.principal === 'S' ? '<span class="ml-2 text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">Principal</span>' : ''}</p>
          <p class="text-gray-700">${[a.logradouro, a.numero, a.bairro].filter(Boolean).join(', ')}</p>
          <p class="text-gray-500">${[a.complemento, a.ponto_ref].filter(Boolean).join(' | ') || ''}</p>
        </div>
        <div class="shrink-0 flex gap-2">
          ${a.principal !== 'S' ? `<button class="px-2 py-1 text-xs border rounded" data-action="addr-primary" data-id="${a.id}">Tornar Principal</button>` : ''}
          <button class="px-2 py-1 text-xs border rounded" data-action="addr-edit" data-id="${a.id}">Editar</button>
          <button class="px-2 py-1 text-xs border rounded text-red-600" data-action="addr-del" data-id="${a.id}">Excluir</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const action = btn.dataset.action;
        const addrId = Number(btn.dataset.id);
        if (action === 'addr-primary') {
          await fetch(`/api/clientes/${clientId}/enderecos/${addrId}/principal`, { method: 'PUT' });
          await loadAddresses(clientId);
        } else if (action === 'addr-del') {
          const confirmed = await toast.confirm(
            'Apagar endereço',
            'Tem certeza que deseja remover este endereço? Esta ação não pode ser desfeita.',
            { confirmText: 'Apagar', cancelText: 'Cancelar' }
          );
          if (!confirmed) return;
          const resp = await fetch(`/api/clientes/${clientId}/enderecos/${addrId}`, { method: 'DELETE' });
          if (!resp.ok) {
            const err = await resp.json().catch(()=>({}));
            toast.error(err.error || 'Falha ao apagar endereço');
            return;
          }
          toast.success('Endereço removido com sucesso!');
          await loadAddresses(clientId);
        } else if (action === 'addr-edit') {
          // Pré-preenche o formulário e ao salvar: add + delete antigo
          const resp = await fetch(`/api/clientes/${clientId}/enderecos`);
          const data = await resp.json();
          const addresses = data.addresses || [];
          const addr = addresses.find(x => x.id === addrId);
          if (!addr) return;
          toggleAddrForm(true);
          fillAddrForm(addr);
          const saveBtn = document.getElementById('addr-save');
          saveBtn.onclick = async () => {
            const payload = readAddrForm(addr.principal === 'S');
            if (!payload) return;
            const ok = await addAddress(clientId, payload);
            if (ok) {
              await fetch(`/api/clientes/${clientId}/enderecos/${addrId}`, { method: 'DELETE' });
              toggleAddrForm(false);
              await loadAddresses(clientId);
            }
          };
        }
      });
    });
  } catch (e) {
    list.innerHTML = '<div class="text-sm text-red-600">Erro ao carregar endereços</div>';
  }
}

function toggleAddrForm(show) {
  const form = document.getElementById('addr-form');
  if (!form) return;
  form.classList.toggle('hidden', !show);
}

function clearAddrForm() {
  ['addr-nome','addr-logradouro','addr-numero','addr-complemento','addr-bairro','addr-ref'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const chk = document.getElementById('addr-principal');
  if (chk) chk.checked = false;
}

function fillAddrForm(addr) {
  document.getElementById('addr-nome').value = addr.nome_end || '';
  document.getElementById('addr-logradouro').value = addr.logradouro || '';
  document.getElementById('addr-numero').value = addr.numero || '';
  document.getElementById('addr-complemento').value = addr.complemento || '';
  document.getElementById('addr-bairro').value = addr.bairro || '';
  document.getElementById('addr-ref').value = addr.ponto_ref || '';
  document.getElementById('addr-principal').checked = addr.principal === 'S';
}

function readAddrForm(defaultPrincipal) {
  const nome_end = document.getElementById('addr-nome').value.trim();
  const logradouro = document.getElementById('addr-logradouro').value.trim();
  const numero = document.getElementById('addr-numero').value.trim();
  const complemento = document.getElementById('addr-complemento').value.trim();
  const bairro = document.getElementById('addr-bairro').value.trim();
  const ponto_ref = document.getElementById('addr-ref').value.trim();
  const principal = document.getElementById('addr-principal').checked ? 'S' : (defaultPrincipal ? 'S' : 'N');
  if (!nome_end || !logradouro || !numero || !bairro) {
    toast.warning('Preencha: Apelido, Logradouro, Número e Bairro');
    return null;
  }
  return { nome_end, logradouro, numero, complemento, bairro, ponto_ref, principal };
}

async function addAddress(clientId, payload) {
  const resp = await fetch(`/api/clientes/${clientId}/enderecos`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  if (!resp.ok) {
    const err = await resp.json().catch(()=>({}));
    toast.error(err.error || 'Falha ao adicionar endereço');
    return false;
  }
  return true;
}

function openEditDialog(customer) {
  const dlg = document.getElementById('edit-client-dialog');
  if (!dlg) return;
  document.getElementById('edit-name').value = customer.name || '';
  document.getElementById('edit-email').value = customer.email || '';
  const tipo = customer.tipo_cliente || 'PF';
  document.getElementById('edit-tipo').value = tipo;
  
  const editDocInput = document.getElementById('edit-doc');
  const editTipoSelect = document.getElementById('edit-tipo');
  
  // Formata documento inicial
  const rawDoc = (customer.cpf || customer.cnpj || '');
  editDocInput.value = formatDocument(rawDoc, tipo);
  
  document.getElementById('edit-notes').value = customer.notes || '';
  dlg.dataset.id = String(customer.id);
  if (typeof dlg.showModal === 'function') dlg.showModal();

  document.getElementById('edit-cancel').onclick = () => dlg.close(), toggleAddrForm(false);
  
  // Reformata documento ao mudar tipo
  editTipoSelect.onchange = () => {
    const digits = editDocInput.value.replace(/\D/g, '');
    editDocInput.value = formatDocument(digits, editTipoSelect.value);
  };
  
  // Formatação em tempo real durante digitação
  editDocInput.oninput = (e) => {
    const input = e.target;
    const oldValue = input.value;
    const oldCursor = input.selectionStart;
    const digits = oldValue.replace(/\D/g, '');
    const formatted = formatDocument(digits, editTipoSelect.value);
    input.value = formatted;
    
    // Preserva posição do cursor
    const digitsBeforeCursor = oldValue.substring(0, oldCursor).replace(/\D/g, '').length;
    let newCursor = 0, digitCount = 0;
    for (let i = 0; i < formatted.length && digitCount < digitsBeforeCursor; i++) {
      if (/\d/.test(formatted[i])) digitCount++;
      newCursor = i + 1;
    }
    input.setSelectionRange(newCursor, newCursor);
  };

  // Endereços
  loadAddresses(customer.id);
  const toggleBtn = document.getElementById('addr-add-toggle');
  if (toggleBtn) toggleBtn.onclick = () => {
    clearAddrForm();
    toggleAddrForm(true);
    const saveBtn = document.getElementById('addr-save');
    saveBtn.onclick = async () => {
      const payload = readAddrForm(false);
      if (!payload) return;
      const ok = await addAddress(customer.id, payload);
      if (ok) {
        toast.success('Endereço adicionado com sucesso!');
        toggleAddrForm(false);
        await loadAddresses(customer.id);
      }
    };
  };
  const cancelAddr = document.getElementById('addr-cancel');
  if (cancelAddr) cancelAddr.onclick = () => toggleAddrForm(false);

  document.getElementById('edit-save').onclick = async () => {
    const id = Number(dlg.dataset.id);
    const payload = {
      name: document.getElementById('edit-name').value.trim(),
      email: document.getElementById('edit-email').value.trim(),
      tipo_cliente: document.getElementById('edit-tipo').value,
      documento: document.getElementById('edit-doc').value.replace(/\D/g, ''),
      notes: document.getElementById('edit-notes').value.trim()
    };
    const resp = await fetch(`/api/clientes/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!resp.ok) {
      const err = await resp.json().catch(()=>({}));
      toast.error(err.error || 'Falha ao salvar');
      return;
    }
    dlg.close();
    toast.success('Cliente atualizado com sucesso!');
    await reload();
  };
}

async function reload() {
  const data = await fetchClients();
  renderClients(data);
}

function init() {
  const backBtn = document.getElementById('btn-back');
  if (backBtn) backBtn.onclick = () => window.history.back();
  document.getElementById('client-search-btn').onclick = async () => {
    state.search = document.getElementById('client-search-admin').value.trim();
    state.page = 1;
    await reload();
  };
  document.getElementById('client-clear-btn').onclick = async () => {
    document.getElementById('client-search-admin').value = '';
    state.search = '';
    state.page = 1;
    await reload();
  };
  document.getElementById('admin-page-prev').onclick = async () => {
    if (state.page > 1) { state.page -= 1; await reload(); }
  };
  document.getElementById('admin-page-next').onclick = async () => {
    state.page += 1; await reload();
  };
  reload();
}

document.addEventListener('DOMContentLoaded', init);
