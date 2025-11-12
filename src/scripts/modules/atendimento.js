export function initAtendimento() {
  // Carregar produtos dinamicamente
  loadProducts();

  const knownBtn = document.getElementById('sim-known-customer');
  const newBtn = document.getElementById('sim-new-customer');
  const endCallButtons = document.querySelectorAll('.btn-end-call');
  const adminToggleButton = document.getElementById('admin-toggle-button');
  const adminDeleteCustomerBtn = document.getElementById('admin-delete-customer');

  if (knownBtn) {
    knownBtn.addEventListener('click', () => {
      window.location.href = '/atendimento/identificado';
    });
  }
  if (newBtn) {
    newBtn.addEventListener('click', () => {
      window.location.href = '/atendimento/novo';
    });
  }

  if (endCallButtons && endCallButtons.length) {
    endCallButtons.forEach(btn => btn.addEventListener('click', () => {
      window.location.href = '/atendimento/idle';
    }));
  }

  if (adminToggleButton) {
    adminToggleButton.addEventListener('click', () => {
      window.location.href = '/admin/usuarios';
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

      console.log('Pedido (Cliente Identificado):', { phone, items: selectedProducts, notes: callNotes });

      // TODO: Enviar para API
      // const response = await fetch('/api/pedidos', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ phone, items: selectedProducts, notes: callNotes })
      // });
      // if (response.ok) {
      //   alert('Pedido registrado com sucesso!');
      //   window.location.href = '/atendimento/idle';
      // }

      alert('Pedido registrado com sucesso!');
    });
  }

  // Tela de novo cliente - salvar e registrar
  const btnSaveAndOrderNew = document.getElementById('btn-save-and-order-new');
  if (btnSaveAndOrderNew) {
    btnSaveAndOrderNew.addEventListener('click', async () => {
      const selectedProducts = getSelectedProducts('new');
      if (selectedProducts.length === 0) {
        alert('Selecione pelo menos um produto.');
        return;
      }
      // TODO: Capturar dados do formulário e chamar /api/clientes e depois /api/pedidos
      alert('Cliente salvo e pedido registrado! (simulação)');
    });
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
        <div class="flex items-center gap-4 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 transition">
          <input type="checkbox" value="${product.name}" class="product-checkbox w-5 h-5 flex-shrink-0 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2" />
          <span class="flex-1 text-sm font-medium text-gray-800 min-w-0">${product.name}</span>
          <input type="number" min="1" value="1" class="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500" data-product="${product.name}" />
        </div>
      `).join('');
    }
    
    // Renderizar produtos no container de novo cliente
    const newContainer = document.getElementById('products-list-new');
    if (newContainer) {
      newContainer.innerHTML = products.map(product => `
        <div class="flex items-center gap-4 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 transition">
          <input type="checkbox" value="${product.name}" class="product-checkbox w-5 h-5 flex-shrink-0 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2" />
          <span class="flex-1 text-sm font-medium text-gray-800 min-w-0">${product.name}</span>
          <input type="number" min="1" value="1" class="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500" data-product="${product.name}" />
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
