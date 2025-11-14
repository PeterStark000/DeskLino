import { toast, setPendingToast } from './toast.js';
import { Utils } from './utils.js';

export function initAtendimento() {
  // Carregar produtos dinamicamente
  loadProducts();

  const knownBtn = document.getElementById('sim-known-customer');
  const newBtn = document.getElementById('sim-new-customer');
  const existingBtn = document.getElementById('sim-existing-number');
  const endCallButtons = document.querySelectorAll('.btn-end-call');
  const adminToggleButton = document.getElementById('admin-toggle-button');
  const adminClientesBtn = document.getElementById('btn-admin-clientes');
  const adminDeleteCustomerBtn = document.getElementById('admin-delete-customer');
  const backBtn = document.getElementById('btn-back');

  if (knownBtn) {
    knownBtn.addEventListener('click', () => {
      openCallModal({
        defaultPhone: '(11) 98765-4321',
        route: '/atendimento/identificado'
      });
    });
  }
  if (newBtn) {
    newBtn.addEventListener('click', () => {
      openCallModal({
        defaultPhone: '(21) 99999-0000',
        route: '/atendimento/novo'
      });
    });
  }

  // Botão: Simular atendimento com número já existente
  if (existingBtn) {
    const dialog = /** @type {HTMLDialogElement|null} */ (document.getElementById('existing-call-modal'));
    const searchInput = document.getElementById('existing-call-search');
    const resultsBox = document.getElementById('existing-call-results');
    const btnCancel = document.getElementById('existing-call-cancel');
    const btnNew = document.getElementById('existing-call-new');
    const btnKnown = document.getElementById('existing-call-known');
    let debounceTimer = null;
    let selectedPhone = '';

    function renderResults(customers) {
      if (!resultsBox) return;
      if (!customers || customers.length === 0) {
        resultsBox.innerHTML = '<div class="p-3 text-sm text-gray-500">Nenhum resultado</div>';
        resultsBox.classList.remove('hidden');
        return;
      }
      resultsBox.innerHTML = customers.map(c => {
        const phonesLine = c.phones || c.phone || '-';
        const primaryPhone = c.phone || (c.phones ? (String(c.phones).split(',')[0] || '').trim() : '');
        const emailPart = c.email ? ` - ${c.email}` : '';
        return `
          <button class="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 result-item" data-phone="${primaryPhone}" data-client-id="${c.id}">
            <div class="font-medium text-sm text-gray-900">${c.name} <span class="text-xs text-gray-500">(#${c.id})</span></div>
            <div class="text-xs text-gray-500">${phonesLine}${emailPart}</div>
          </button>`;
      }).join('');

      resultsBox.querySelectorAll('.result-item').forEach(btn => {
        btn.addEventListener('click', () => {
          // Marca seleção visual
          resultsBox.querySelectorAll('.result-item').forEach(b => b.classList.remove('bg-blue-50'));
          btn.classList.add('bg-blue-50');
          selectedPhone = btn.getAttribute('data-phone') || '';
          if (searchInput && selectedPhone) searchInput.value = selectedPhone;
        });
      });

      resultsBox.classList.remove('hidden');
    }

    async function performSearch(term) {
      try {
        const resp = await fetch(`/api/clientes/search?q=${encodeURIComponent(term)}`);
        if (!resp.ok) throw new Error('Erro ao buscar');
        const { customers } = await resp.json();
        const map = new Map();
        for (const c of customers || []) {
          if (!map.has(c.id)) map.set(c.id, c);
        }
        renderResults(Array.from(map.values()));
      } catch (e) {
        if (resultsBox) {
          resultsBox.innerHTML = `<div class="p-3 text-sm text-red-600">Erro ao buscar: ${e.message}</div>`;
          resultsBox.classList.remove('hidden');
        }
      }
    }

    existingBtn.addEventListener('click', () => {
      selectedPhone = '';
      if (resultsBox) { resultsBox.innerHTML = ''; resultsBox.classList.add('hidden'); }
      if (searchInput) searchInput.value = '';
      if (dialog) try { dialog.showModal(); } catch {}
    });

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const term = searchInput.value.trim();
        selectedPhone = '';
        if (debounceTimer) clearTimeout(debounceTimer);
        if (term.length < 2) {
          if (resultsBox) resultsBox.classList.add('hidden');
          return;
        }
        debounceTimer = setTimeout(() => performSearch(term), 300);
      });
    }

    if (btnCancel && dialog) {
      btnCancel.addEventListener('click', () => {
        dialog.close();
        toast.info('Operação cancelada.');
      });
    }

    async function proceed(route) {
      const entered = (searchInput?.value || '').trim();
      const phone = selectedPhone || entered;
      if (!phone) { toast.warning('Digite ou selecione um número.'); return; }
      try {
        const response = await fetch(`/api/clientes/${encodeURIComponent(phone)}`);
        const clientExists = response.ok;
        const isKnown = route.includes('identificado');
        const isNew = route.includes('novo');
        if (isKnown && !clientExists) { toast.warning('Cliente não encontrado para este número.'); return; }
        if (isNew && clientExists) { toast.warning('Este número já está cadastrado. Use Cliente Identificado.'); return; }
        localStorage.setItem('currentCallPhone', phone);
        dialog?.close();
        window.location.href = route;
      } catch (error) {
        console.error('Erro ao validar telefone (modal existente):', error);
        toast.error('Erro ao validar telefone.');
      }
    }

    if (btnNew) btnNew.addEventListener('click', () => proceed('/atendimento/novo'));
    if (btnKnown) btnKnown.addEventListener('click', () => proceed('/atendimento/identificado'));
  }

  if (endCallButtons && endCallButtons.length) {
    endCallButtons.forEach(btn => btn.addEventListener('click', () => {
      setPendingToast('info', 'Atendimento finalizado');
      window.location.href = '/atendimento/idle';
    }));
  }

  if (adminToggleButton) {
    adminToggleButton.addEventListener('click', () => {
      window.location.href = '/admin/usuarios';
    });
  }

  if (adminClientesBtn) {
    adminClientesBtn.addEventListener('click', () => {
      window.location.href = '/admin/clientes';
    });
  }

  if (adminDeleteCustomerBtn) {
    adminDeleteCustomerBtn.addEventListener('click', () => {
      const customerNameEl = document.getElementById('cust-name');
      const customerName = customerNameEl ? customerNameEl.textContent : '';
      console.warn(`(Simulação) Botão de apagar cliente '${customerName}' clicado.`);
      window.location.href = '/atendimento/idle';
    });
  }

  // Botão voltar nas páginas de atendimento
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = '/atendimento/idle';
    });
  }

  // Inicializa lógica de Tipo de Cliente (PF/PJ) e CPF/CNPJ na página de novo atendimento
  const tipoClienteSelect = document.getElementById('new-tipo-cliente');
  const docContainer = document.getElementById('new-doc-container');
  const docInput = document.getElementById('new-doc');
  const docLabel = document.getElementById('new-doc-label');

  if (tipoClienteSelect && docContainer && docInput && docLabel) {
    const updateDocField = () => {
      const tipo = tipoClienteSelect.value;
      if (tipo === 'PF' || tipo === 'PJ') {
        docContainer.classList.remove('hidden');
        docLabel.textContent = (tipo === 'PF' ? 'CPF' : 'CNPJ') + ' *';
        docInput.placeholder = tipo === 'PF' ? '000.000.000-00' : '00.000.000/0000-00';
      } else {
        docContainer.classList.add('hidden');
        docInput.value = '';
      }
    };
    tipoClienteSelect.addEventListener('change', updateDocField);
    updateDocField(); // estado inicial

    docInput.addEventListener('input', (e) => {
      const input = e.target;
      const oldValue = input.value;
      const oldCursor = input.selectionStart;
      const digits = oldValue.replace(/\D/g, '');
      let formatted = '';
      const tipo = tipoClienteSelect.value;
      if (tipo === 'PF') {
        if (digits.length <= 11) {
          formatted = digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
          if (digits.length <= 3) formatted = digits;
          else if (digits.length <= 6) formatted = digits.replace(/(\d{3})(\d+)/, '$1.$2');
          else if (digits.length <= 9) formatted = digits.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
        } else {
          formatted = digits.substring(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
      } else if (tipo === 'PJ') {
        if (digits.length <= 14) {
          if (digits.length <= 2) formatted = digits;
          else if (digits.length <= 5) formatted = digits.replace(/(\d{2})(\d+)/, '$1.$2');
          else if (digits.length <= 8) formatted = digits.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
          else if (digits.length <= 12) formatted = digits.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4');
          else formatted = digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        } else {
          formatted = digits.substring(0, 14).replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
      } else {
        formatted = digits;
      }
      input.value = formatted;
      const digitsBeforeCursor = Utils.onlyDigits(oldValue.substring(0, oldCursor)).length;
      let newCursor = 0; let digitCount = 0;
      for (let i = 0; i < formatted.length && digitCount < digitsBeforeCursor; i++) {
        if (/\d/.test(formatted[i])) digitCount++;
        newCursor = i + 1;
      }
      input.setSelectionRange(newCursor, newCursor);
    });
  }

  // Gerenciamento de pedidos - Cliente Identificado
  const btnRegisterOrderKnown = document.getElementById('btn-register-order-known');
  if (btnRegisterOrderKnown) {
    btnRegisterOrderKnown.addEventListener('click', async () => {
      const selectedProducts = getSelectedProducts('known');
      if (selectedProducts.length === 0) {
        alert('Selecione pelo menos um produto.');
        return;
      }

      const callNotes = document.getElementById('call-notes-known')?.value || '';
      const phone = document.getElementById('known-phone')?.textContent;
      const paymentMethod = document.getElementById('payment-method-known')?.value || 'Dinheiro';
      const addressSelect = document.getElementById('address-select-display');
      const addressId = addressSelect?.value ? parseInt(addressSelect.value, 10) : null;
      
      try {
        // 1) Buscar cliente por telefone para obter ID
        const clientResp = await fetch(`/api/clientes/${encodeURIComponent(phone)}`);
        if (!clientResp.ok) {
          toast.error('Não foi possível identificar o cliente pelo telefone.');
          return;
        }
        const { customer } = await clientResp.json();

        // 2) Obter usuário logado
        const rawUser = localStorage.getItem('user');
        const user = rawUser ? JSON.parse(rawUser) : { name: 'Desconhecido' };

        // 3) Enviar pedido com endereço selecionado
        const response = await fetch('/api/pedidos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: customer.id, items: selectedProducts, notes: callNotes, user: user.name, forma_pag: paymentMethod, address_id: addressId })
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || 'Erro ao registrar pedido');
        }

  // Persistir toast para após redirecionar
  setPendingToast('success', 'Pedido registrado com sucesso!');
  window.location.href = '/atendimento/idle';
      } catch (e) {
        console.error('Falha ao registrar pedido (identificado):', e);
        toast.error(e.message);
      }
    });
  }

  // Tela de novo cliente - salvar e registrar
  const btnSaveAndOrderNew = document.getElementById('btn-save-and-order-new');
  if (btnSaveAndOrderNew) {
    btnSaveAndOrderNew.addEventListener('click', async () => {
      const selectedProducts = getSelectedProducts('new');
      if (selectedProducts.length === 0) {
        toast.warning('Selecione pelo menos um produto.');
        return;
      }
      await saveNewClientAndOrder(selectedProducts, true);
    });
  }

  // Botão apenas salvar cliente
  const btnSaveOnlyNew = document.getElementById('btn-save-only-new');
  if (btnSaveOnlyNew) {
    btnSaveOnlyNew.addEventListener('click', async () => {
      await saveNewClientAndOrder([], false);
    });
  }

  // Busca de cliente (auto-complete no "novo atendimento")
  const clientSearchInput = document.getElementById('client-search-input');
  const clientSearchResults = document.getElementById('client-search-results');

  if (clientSearchInput && clientSearchResults) {
    let debounceTimer = null;

    const renderResults = (customers) => {
      if (!customers || customers.length === 0) {
        clientSearchResults.innerHTML = '<div class="p-3 text-sm text-gray-500">Nenhum cliente encontrado</div>';
        clientSearchResults.classList.remove('hidden');
        return;
      }
      clientSearchResults.innerHTML = customers.map(c => {
        const phonesLine = c.phones || c.phone || '-';
        const emailPart = c.email ? ` - ${c.email}` : '';
        return `
        <button class="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 client-result" data-client-id="${c.id}" data-client-phone="${c.phone || ''}">
          <div class="font-medium text-sm text-gray-900">${c.name}</div>
          <div class="text-xs text-gray-500">${phonesLine}${emailPart}</div>
        </button>`;
      }).join('');

      clientSearchResults.querySelectorAll('.client-result').forEach(btn => {
        btn.addEventListener('click', async () => {
          const phone = btn.getAttribute('data-client-phone');
          const clientId = btn.getAttribute('data-client-id');
          
          // Se estiver no novo atendimento, preenche os campos do formulário
          if (window.location.pathname.includes('/atendimento/novo')) {
            clientSearchResults.classList.add('hidden');
            clientSearchInput.value = '';
            await fillNewClientForm(phone, clientId);
          } else {
            // Se estiver em identificado, recarrega com o telefone
            localStorage.setItem('currentCallPhone', phone);
            window.location.reload();
          }
        });
      });

      clientSearchResults.classList.remove('hidden');
    };

    const performSearch = async (term) => {
      try {
        const resp = await fetch(`/api/clientes/search?q=${encodeURIComponent(term)}`);
        if (!resp.ok) throw new Error('Erro ao buscar');
        const { customers } = await resp.json();
        // Dedupe por id (garantia extra caso backend retorne duplicados)
        const map = new Map();
        for (const c of customers || []) {
          if (!map.has(c.id)) map.set(c.id, c);
        }
        renderResults(Array.from(map.values()));
      } catch (e) {
        clientSearchResults.innerHTML = `<div class="p-3 text-sm text-red-600">Erro ao buscar clientes: ${e.message}</div>`;
        clientSearchResults.classList.remove('hidden');
      }
    };

    clientSearchInput.addEventListener('input', () => {
      const term = clientSearchInput.value.trim();
      if (debounceTimer) clearTimeout(debounceTimer);

      if (term.length < 3) {
        clientSearchResults.classList.add('hidden');
        return;
      }

      debounceTimer = setTimeout(() => performSearch(term), 300);
    });

    document.addEventListener('click', (e) => {
      if (!clientSearchResults.contains(e.target) && e.target !== clientSearchInput) {
        clientSearchResults.classList.add('hidden');
      }
    });
  }

  // Ao carregar páginas de atendimento identificado ou novo, aplicar telefone salvo
  const storedPhone = localStorage.getItem('currentCallPhone');
  if (storedPhone) {
    const knownPhoneEl = document.getElementById('known-phone');
    if (knownPhoneEl) {
      knownPhoneEl.textContent = storedPhone;
      // Carrega dados do cliente
      loadClientData(storedPhone);
    }
    const newPhoneEl = document.getElementById('new-phone');
    if (newPhoneEl) {
      newPhoneEl.textContent = storedPhone;
      document.getElementById('new-phone-input').value = storedPhone;
    }
  }
}

/**
 * Função auxiliar para salvar novo cliente (com ou sem pedido)
 */
async function saveNewClientAndOrder(selectedProducts, createOrder) {
  try {
    const phone = document.getElementById('new-phone')?.textContent?.trim();
    const linkClientId = sessionStorage.getItem('linkClientId');
    const emailInput = document.getElementById('new-email');
    const emailVal = emailInput ? emailInput.value.trim() : '';
    
    // Se está vinculando a um cliente existente
    if (linkClientId) {
      try {
        // Adiciona novo telefone ao cliente existente
        const phoneResp = await fetch(`/api/clientes/${linkClientId}/telefones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ numero: phone })
        });
        if (!phoneResp.ok) throw new Error('Erro ao adicionar telefone');
        
        // Tenta atualizar email do cliente (opcional)
        if (emailVal) {
          try {
            await fetch(`/api/clientes/${linkClientId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailVal }) });
          } catch {}
        }

        // Se também deve criar pedido
        if (createOrder && selectedProducts.length > 0) {
          const paymentMethod = document.getElementById('payment-method-new')?.value || 'Dinheiro';
          const orderResp = await fetch('/api/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_id: linkClientId, items: selectedProducts, notes: '', forma_pag: paymentMethod })
          });
          if (!orderResp.ok) throw new Error('Erro ao registrar pedido');
          setPendingToast('success', 'Telefone vinculado e pedido registrado com sucesso!');
        } else {
          setPendingToast('success', 'Telefone vinculado ao cliente com sucesso!');
        }
        
        sessionStorage.removeItem('linkClientId');
        window.location.href = '/atendimento/idle';
        return;
      } catch (e) {
        toast.error('Erro: ' + e.message);
        return;
      }
    }
    
    // Caso contrário, cria novo cliente
    const name = document.getElementById('new-name')?.value?.trim();
    const tipoCliente = document.getElementById('new-tipo-cliente')?.value;
    const email = emailVal;
    const documento = document.getElementById('new-doc')?.value?.trim();
    const addressRaw = document.getElementById('new-address')?.value?.trim();
    const bairro = document.getElementById('new-bairro')?.value?.trim();
    const ref = document.getElementById('new-ref')?.value?.trim();
    const notes = document.getElementById('new-notes')?.value?.trim();
    const paymentMethod = document.getElementById('payment-method-new')?.value || 'Dinheiro';

    if (!phone || !name || !addressRaw || !bairro || !tipoCliente) {
      toast.warning('Telefone, nome, endereço, bairro e tipo de cliente são obrigatórios.');
      return;
    }

    if (!documento) {
      toast.warning('CPF ou CNPJ é obrigatório.');
      return;
    }
    
    const digitsOnly = Utils.onlyDigits(documento);
    if (tipoCliente === 'PF' && digitsOnly.length !== 11) {
      toast.warning('CPF deve ter 11 dígitos.');
      return;
    }
    if (tipoCliente === 'PJ' && digitsOnly.length !== 14) {
      toast.warning('CNPJ deve ter 14 dígitos.');
      return;
    }
    
    // Parse simples: "Rua, Numero"
    let address = addressRaw;
    let number = 'S/N';
    const parts = addressRaw.split(',');
    if (parts.length >= 2) {
      number = parts.pop().trim();
      address = parts.join(',').trim();
    }

    // Usuário logado
    const rawUser = localStorage.getItem('user');
    const user = rawUser ? JSON.parse(rawUser) : { name: 'Desconhecido' };

    // 1) Criar cliente
    const clientResp = await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name, email, address, number, bairro, ref, notes, user: user.name, tipo_cliente: tipoCliente, documento: digitsOnly })
    });
    if (!clientResp.ok) {
      const err = await clientResp.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao criar cliente');
    }
    const clientData = await clientResp.json();
    const client_id = clientData.clientId;

    // 2) Criar pedido (se solicitado)
    if (createOrder && selectedProducts.length > 0) {
      const orderResp = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id, items: selectedProducts, notes, forma_pag: paymentMethod })
      });
      if (!orderResp.ok) {
        const err = await orderResp.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao registrar pedido');
      }
      setPendingToast('success', 'Cliente salvo e pedido registrado com sucesso!');
    } else {
      setPendingToast('success', 'Cliente salvo com sucesso!');
    }
    
    window.location.href = '/atendimento/idle';
  } catch (e) {
    console.error('Falha ao salvar cliente:', e);
    toast.error(e.message);
  }
}

/**
 * Preenche formulário de novo cliente com dados de cliente existente
 */
async function fillNewClientForm(phone, clientId) {
  try {
    const response = await fetch(`/api/clientes/${encodeURIComponent(phone)}`);
    if (!response.ok) return;
    
    const { customer } = await response.json();
    
    // Exibe banner informativo
    const banner = document.getElementById('selected-client-banner');
    const bannerName = document.getElementById('selected-client-name');
    if (banner && bannerName) {
      bannerName.textContent = customer.name;
      banner.classList.remove('hidden');
    }
    
    // Preenche campos do formulário (desabilitados para não alterar)
    const nameInput = document.getElementById('new-name');
    const addressInput = document.getElementById('new-address');
    const emailInput = document.getElementById('new-email');
    const bairroInput = document.getElementById('new-bairro');
    const refInput = document.getElementById('new-ref');
    const notesInput = document.getElementById('new-notes');
    
    if (nameInput) {
      nameInput.value = customer.name || '';
      nameInput.setAttribute('readonly', 'true');
      nameInput.classList.add('bg-gray-100', 'text-gray-600');
    }
    if (emailInput) {
      emailInput.value = customer.email || '';
      // email permanece editável para atualização opcional
    }
    if (addressInput && customer.address) {
      const fullAddr = [customer.address, customer.number].filter(Boolean).join(', ');
      addressInput.value = fullAddr;
      addressInput.setAttribute('readonly', 'true');
      addressInput.classList.add('bg-gray-100', 'text-gray-600');
    }
    if (bairroInput && customer.bairro) {
      bairroInput.value = customer.bairro;
      bairroInput.setAttribute('readonly', 'true');
      bairroInput.classList.add('bg-gray-100', 'text-gray-600');
    }
    if (refInput && customer.ref) {
      refInput.value = customer.ref;
      refInput.setAttribute('readonly', 'true');
      refInput.classList.add('bg-gray-100', 'text-gray-600');
    }
    if (notesInput && customer.notes) {
      notesInput.value = customer.notes;
      notesInput.setAttribute('readonly', 'true');
      notesInput.classList.add('bg-gray-100', 'text-gray-600');
    }
    
    // Armazena o client_id para usar ao salvar
    sessionStorage.setItem('linkClientId', customer.id);
    
  } catch (error) {
    console.error('Erro ao preencher formulário:', error);
  }
}

/**
 * Carrega dados do cliente identificado
 */
async function loadClientData(phone) {
  try {
    const response = await fetch(`/api/clientes/${encodeURIComponent(phone)}`);
    if (!response.ok) {
      console.error('Cliente não encontrado');
      return;
    }
    
    const data = await response.json();
    const customer = data.customer;
    
    console.log('Cliente carregado:', customer);
    console.log('ID do cliente:', customer.id);
    
    // Atualiza dados na página
    const nameEl = document.getElementById('cust-name');
    const emailEl = document.getElementById('cust-email');
    const typeEl = document.getElementById('cust-type');
    const docEl = document.getElementById('cust-doc');
    const addressEl = document.getElementById('cust-address');
    const refEl = document.getElementById('cust-ref');
    const notesEl = document.getElementById('cust-notes');
    
    if (nameEl) nameEl.textContent = customer.name || '-';
    if (emailEl) emailEl.textContent = customer.email || '-';
    if (typeEl) typeEl.textContent = customer.tipo_cliente === 'PF' ? 'Pessoa Física' : (customer.tipo_cliente === 'PJ' ? 'Pessoa Jurídica' : '-');
    if (docEl) {
      const docVal = customer.cpf || customer.cnpj || '';
      docEl.textContent = Utils.formatCpfCnpj(docVal);
    }
    if (notesEl) notesEl.value = customer.notes || '';
    
    // Carrega endereços do cliente (que irá preencher cust-address e cust-ref)
    await loadClientAddresses(customer.id);
    // Carrega histórico de pedidos
    await loadClientOrderHistory(customer.id);
    
  } catch (error) {
    console.error('Erro ao carregar dados do cliente:', error);
  }
}

/**
 * Carrega endereços do cliente
 */

let currentClientId = null;
let clientAddresses = [];

async function loadClientAddresses(clientId) {
  currentClientId = clientId;
  try {
    const response = await fetch(`/api/clientes/${clientId}/enderecos`);
    if (!response.ok) return;
    
    const { addresses } = await response.json();
    clientAddresses = addresses || [];
    
    // Preenche seletor de visualização (Dados Cadastrais)
    const selectDisplay = document.getElementById('address-select-display');
    if (selectDisplay && addresses.length > 0) {
      selectDisplay.innerHTML = addresses.map(addr => {
        const principal = addr.principal === 'S' ? ' ⭐' : '';
        return `<option value="${addr.id}" ${addr.principal === 'S' ? 'selected' : ''}>${addr.nome_end}${principal}</option>`;
      }).join('');
      
      // Atualiza campos imediatamente com o endereço selecionado
      const firstAddr = addresses.find(a => a.principal === 'S') || addresses[0];
      if (firstAddr) {
        const addrEl = document.getElementById('cust-address');
        const refEl = document.getElementById('cust-ref');
        if (addrEl) {
          const fullAddr = [firstAddr.logradouro, firstAddr.numero, firstAddr.bairro].filter(Boolean).join(', ');
          addrEl.textContent = fullAddr;
        }
        if (refEl) {
          const refText = [firstAddr.complemento, firstAddr.ponto_ref].filter(Boolean).join(' - ');
          refEl.textContent = refText || '-';
        }
      }
      
      // Atualiza campos de endereço ao mudar seleçãoo
      selectDisplay.addEventListener('change', () => {
        const selectedId = parseInt(selectDisplay.value, 10);
        const addr = addresses.find(a => a.id === selectedId);
        if (addr) {
          const addrEl = document.getElementById('cust-address');
          const refEl = document.getElementById('cust-ref');
          
          if (addrEl) {
            const fullAddr = [addr.logradouro, addr.numero, addr.bairro].filter(Boolean).join(', ');
            addrEl.textContent = fullAddr;
          }
          if (refEl) {
            const refText = [addr.complemento, addr.ponto_ref].filter(Boolean).join(' - ');
            refEl.textContent = refText || '-';
          }
        }
      });
    }
    
    // Handlers para adicionar endereço
    const btnAdd = document.getElementById('btn-add-address-known');
    const btnSetPrimary = document.getElementById('btn-set-primary-address-known');
    const btnSave = document.getElementById('btn-save-address-known');
    const btnCancel = document.getElementById('btn-cancel-address-known');
    const form = document.getElementById('address-form-known');
    
    if (btnAdd && form) {
      btnAdd.onclick = () => form.classList.remove('hidden');
    }
    
    if (btnSetPrimary) {
      btnSetPrimary.onclick = async () => {
        const selectedId = parseInt(selectDisplay?.value, 10);
        if (!selectedId) {
          alert('Selecione um endereço primeiro');
          return;
        }
        try {
          const response = await fetch(`/api/clientes/${clientId}/enderecos/${selectedId}/principal`, {
            method: 'PUT'
          });
          if (!response.ok) throw new Error('Erro ao definir principal');
          toast.success('Endereço principal atualizado!');
          await loadClientAddresses(clientId);
        } catch (e) {
          toast.error('Erro: ' + e.message);
        }
      };
    }
    
    const btnDelete = document.getElementById('btn-delete-address-known');
    if (btnDelete) {
      btnDelete.onclick = async () => {
        const selectedId = parseInt(selectDisplay?.value, 10);
        if (!selectedId) {
          toast.warning('Selecione um endereço primeiro');
          return;
        }
        const confirmed = await toast.confirm(
          'Apagar endereço',
          'Tem certeza que deseja remover este endereço? Esta ação não pode ser desfeita.',
          { confirmText: 'Apagar', cancelText: 'Cancelar' }
        );
        if (!confirmed) return;
        try {
          const response = await fetch(`/api/clientes/${clientId}/enderecos/${selectedId}`, {
            method: 'DELETE'
          });
          if (!response.ok) throw new Error('Erro ao apagar endereço');
          toast.success('Endereço apagado com sucesso!');
          await loadClientAddresses(clientId);
        } catch (e) {
          toast.error('Erro: ' + e.message);
        }
      };
    }
    if (btnCancel && form) {
      btnCancel.onclick = () => {
        form.classList.add('hidden');
        // Limpa campos
        ['addr-nome', 'addr-logradouro', 'addr-numero', 'addr-bairro', 'addr-complemento', 'addr-ref'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });
        const checkbox = document.getElementById('addr-principal');
        if (checkbox) checkbox.checked = false;
      };
    }
    if (btnSave && form) {
      btnSave.onclick = async () => {
        const nome_end = document.getElementById('addr-nome')?.value?.trim();
        const logradouro = document.getElementById('addr-logradouro')?.value?.trim();
        const numero = document.getElementById('addr-numero')?.value?.trim();
        const bairro = document.getElementById('addr-bairro')?.value?.trim();
        const complemento = document.getElementById('addr-complemento')?.value?.trim();
        const ponto_ref = document.getElementById('addr-ref')?.value?.trim();
        const principal = document.getElementById('addr-principal')?.checked ? 'S' : 'N';
        
        if (!nome_end || !logradouro || !numero || !bairro) {
          toast.warning('Preencha Nome, Logradouro, Número e Bairro');
          return;
        }
        
        try {
          const response = await fetch(`/api/clientes/${clientId}/enderecos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome_end, logradouro, numero, complemento, bairro, ponto_ref, principal })
          });
          if (!response.ok) throw new Error('Erro ao adicionar endereço');
          
          toast.success('Endereço adicionado com sucesso!');
          form.classList.add('hidden');
          // Limpa campos
          ['addr-nome', 'addr-logradouro', 'addr-numero', 'addr-bairro', 'addr-complemento', 'addr-ref'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
          });
          const checkbox = document.getElementById('addr-principal');
          if (checkbox) checkbox.checked = false;
          // Recarrega endereços e atualiza campos
          await loadClientAddresses(clientId);
          // Seleciona o endereço principal ou o primeiro
          const newSelect = document.getElementById('address-select-display');
          if (newSelect && newSelect.options.length > 0) {
            newSelect.dispatchEvent(new Event('change'));
          }
        } catch (e) {
          toast.error('Erro ao salvar endereço: ' + e.message);
        }
      };
    }
    
  } catch (error) {
    console.error('Erro ao carregar endereços:', error);
  }
}

// =============================
// Histórico de pedidos (cliente identificado)
// =============================
async function loadClientOrderHistory(clientId) {
  const container = document.getElementById('order-history-list');
  if (!container) {
    console.warn('Container order-history-list não encontrado');
    return;
  }
  
  console.log('Carregando histórico para clientId:', clientId);
  
  try {
    const resp = await fetch(`/api/clientes/${clientId}/pedidos`);
    console.log('Response status:', resp.status);
    
    if (!resp.ok) {
      const errorText = await resp.text();
      console.error('Erro na resposta:', errorText);
      throw new Error('Falha ao buscar histórico');
    }
    
    const data = await resp.json();
    console.log('Dados recebidos:', data);
    
    const { history } = data;
    
    if (!history || history.length === 0) {
      container.innerHTML = '<div class="p-3 bg-gray-50 rounded-lg border text-sm text-gray-500">Nenhum pedido encontrado</div>';
      return;
    }
    
    container.innerHTML = history.map(h => {
      const dateStr = h.created_at ? new Date(h.created_at).toLocaleDateString('pt-BR') : '-';
      const status = h.status || 'Desconhecido';
      const products = h.products || '-';
      return `
        <div class="p-3 bg-gray-50 rounded-lg border">
          <p class="font-medium text-gray-800 text-sm">${products}</p>
          <p class="text-xs text-gray-500">${dateStr} - ${status}</p>
        </div>
      `;
    }).join('');
  } catch (e) {
    console.error('Erro ao carregar histórico:', e);
    container.innerHTML = `<div class="p-3 bg-red-50 rounded-lg border text-sm text-red-600">Erro ao carregar histórico: ${e.message}</div>`;
  }
}

/**
 * Carrega produtos da API e renderiza nas páginas de atendimento
 */
async function loadProducts() {
  try {
    const response = await fetch('/api/produtos');
    if (!response.ok) {
      console.error('Erro ao buscar produtos');
      return;
    }
    
    const data = await response.json();
    const products = data.products || [];
    
    // Renderizar produtos no container de cliente identificado
    const knownContainer = document.getElementById('products-list-known');
    if (knownContainer) {
      knownContainer.innerHTML = products.map(product => `
        <div class="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 shadow-sm transition">
          <div class="flex items-center gap-2">
            <input type="checkbox" value="${product.name}" class="product-checkbox w-5 h-5 flex-shrink-0 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2" />
            <span class="flex-1 text-sm font-medium text-gray-800 min-w-0">${product.name}</span>
          </div>
        <input type="number" min="1" value="1" class="w-16 px-2 py-1.5 text-sm text-right border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" data-product="${product.name}" />
        </div>
      `).join('');
    }
    
    // Renderizar produtos no container de novo cliente
    const newContainer = document.getElementById('products-list-new');
    if (newContainer) {
      newContainer.innerHTML = products.map(product => `
        <div class="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 shadow-sm transition">
          <div class="flex items-center gap-2">
            <input type="checkbox" value="${product.name}" class="product-checkbox w-5 h-5 flex-shrink-0 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2" />
            <span class="flex-1 text-sm font-medium text-gray-800 min-w-0">${product.name}</span>
          </div>
        <input type="number" min="1" value="1" class="w-16 px-2 py-1.5 text-sm text-right border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" data-product="${product.name}" />
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
  }
}

/**
 * Captura produtos selecionados com suas quantidades
 * @param {string} context - 'known' ou 'new'
 * @returns {Array} [{product: string, quantity: number}, ...]
 */
function getSelectedProducts(context) {
  const listId = context === 'known' ? 'products-list-known' : 'products-list-new';
  const container = document.getElementById(listId);
  if (!container) return [];

  const checkboxes = container.querySelectorAll('.product-checkbox:checked');
  const selected = [];

  checkboxes.forEach(cb => {
    const productName = cb.value;
    const qtyInput = container.querySelector(`input[data-product="${productName}"]`);
    const quantity = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
    selected.push({ product: productName, quantity });
  });

  return selected;
}

/**
 * Formata número de telefone com máscara (XX) XXXX-XXXX ou (XX) XXXXX-XXXX
 */
// formatPhone e formatCpfCnpj migraram para Utils

/**
 * Abre modal de simulação de chamada
 * @param {{defaultPhone:string, route:string}} param0
 */
function openCallModal({ defaultPhone, route }) {
  /** @type {HTMLDialogElement|null} */
  const dialog = document.getElementById('call-modal');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const phoneInput = document.getElementById('call-phone-input');
  const btnCancel = document.getElementById('call-modal-cancel');
  const btnConfirm = document.getElementById('call-modal-confirm');

  phoneInput.value = defaultPhone || '';
  dialog.showModal();
  setTimeout(() => phoneInput.focus(), 0);

  // Formatação automática durante digitação
  phoneInput.addEventListener('input', (e) => {
    const input = e.target;
    const oldValue = input.value;
    const oldCursor = input.selectionStart;
    const formatted = Utils.formatPhone(oldValue);
    input.value = formatted;
    
    // Calcula nova posição do cursor baseada nos dígitos antes do cursor
    const digitsBeforeCursor = Utils.onlyDigits(oldValue.substring(0, oldCursor)).length;
    let newCursor = 0;
    let digitCount = 0;
    for (let i = 0; i < formatted.length && digitCount < digitsBeforeCursor; i++) {
      if (/\d/.test(formatted[i])) digitCount++;
      newCursor = i + 1;
    }
    input.setSelectionRange(newCursor, newCursor);
  });

  const close = () => dialog.close();

  btnCancel.onclick = () => close();
  btnConfirm.onclick = async () => {
    const entered = phoneInput.value.trim();
    if (!entered) {
      toast.warning('Informe um número de telefone.');
      return;
    }

    // Validação contra database
    const isKnownCustomer = route.includes('identificado');
    const isNewCustomer = route.includes('novo');

    try {
      const response = await fetch(`/api/clientes/${encodeURIComponent(entered)}`);
      const clientExists = response.ok;

      if (isKnownCustomer && !clientExists) {
        toast.warning('Cliente não encontrado no sistema. Use a opção "Simular Chamada (Novo Cliente)" para cadastrar.');
        return;
      }

      if (isNewCustomer && clientExists) {
        toast.warning('Este telefone já está cadastrado. Use a opção "Simular Chamada (Cliente Identificado)".');
        return;
      }

      localStorage.setItem('currentCallPhone', entered);
      close();
      window.location.href = route;
    } catch (error) {
      console.error('Erro ao validar telefone:', error);
      toast.error('Erro ao validar telefone. Tente novamente.');
    }
  };

  // Fechar clicando no backdrop (clique no próprio dialog fora do conteúdo)
  const clickHandler = (e) => {
    if (e.target === dialog) close();
  };
  dialog.addEventListener('click', clickHandler, { once: true });
}
