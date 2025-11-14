export function initAdmin() {
  const usersTbody = document.getElementById('users-table-body');
  const logsTbody = document.getElementById('logs-table-body');
  const nav = document.getElementById('admin-nav');
  const backBtn = document.getElementById('btn-back');

  if (backBtn) backBtn.onclick = () => { window.location.href = '/atendimento/idle'; };

  // Controle de visibilidade de abas por papel
  const rawUser = localStorage.getItem('user');
  let role = null;
  try { role = rawUser ? JSON.parse(rawUser).role : null; } catch (_) {}
  if (nav && role) {
    const links = nav.querySelectorAll('a.admin-tab-button');
    links.forEach(a => {
      const href = a.getAttribute('href') || '';
      if (role !== 'admin') {
        // Atendente: pode ver Gerenciar Clientes e Gerenciar Telefones
        if (href.includes('/admin/usuarios') || href.includes('/admin/logs')) {
          a.classList.add('hidden');
        }
      }
    });
    // Redireciona atendente para clientes se estiver em outra aba
    if (role !== 'admin') {
      const path = window.location.pathname;
      if (path.startsWith('/admin') && !(path.includes('/admin/clientes') || path.includes('/admin/telefones'))) {
        window.location.href = '/admin/clientes';
      }
    }
  }

  if (usersTbody) {
    fetch('/api/usuarios').then(r => r.json()).then(data => {
      usersTbody.innerHTML = data.users.map(u => `
        <tr>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${u.username}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${u.name}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            <select class="rounded-md border-gray-300 shadow-sm">
              <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
              <option value="atendente" ${u.role === 'atendente' ? 'selected' : ''}>Atendente</option>
            </select>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button class="text-blue-600 hover:text-blue-900">Salvar</button>
          </td>
        </tr>`).join('');
    });
  }

  if (logsTbody) {
    fetch('/api/logs').then(r => r.json()).then(data => {
      logsTbody.innerHTML = data.logs.map(l => {
        const date = new Date(l.datetime);
        const formattedDate = date.toLocaleString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit', 
          minute: '2-digit'
        });
        return `
        <tr>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${formattedDate}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${l.user}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${l.detail}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${l.phone || '-'}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <button class="text-blue-600 hover:text-blue-900 btn-view-order" data-atendimento-id="${l.id}">Ver pedido</button>
          </td>
        </tr>`;
      }).join('');

      // Bind modal open for each button
      const buttons = document.querySelectorAll('.btn-view-order');
      const dialog = document.getElementById('order-modal');
      const closeBtn = document.getElementById('order-modal-close');
      const body = document.getElementById('order-modal-body');

      const openModal = () => dialog && typeof dialog.showModal === 'function' && dialog.showModal();
      const closeModal = () => dialog && dialog.close();
      if (closeBtn) closeBtn.onclick = () => closeModal();
      if (dialog) dialog.addEventListener('click', (e) => { if (e.target === dialog) closeModal(); });

      buttons.forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-atendimento-id');
          if (!id) return;
          body.innerHTML = '<p class="text-sm text-gray-600">Carregando...</p>';
          openModal();
          try {
            const resp = await fetch(`/api/atendimentos/${id}/pedido`);
            if (!resp.ok) {
              body.innerHTML = '<p class="text-sm text-red-600">Pedido não encontrado para este atendimento.</p>';
              return;
            }
            const { order } = await resp.json();
            const itemsHtml = (order.items || []).map(it => `
              <li class="flex justify-between"><span>${it.product}</span><span class="text-gray-600">${it.quantity}x</span></li>
            `).join('');
            body.innerHTML = `
              <div class="space-y-2">
                <p><strong>Pedido:</strong> #${order.id}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                <p><strong>Forma de Pagamento:</strong> ${order.payment_method}</p>
                <p><strong>Observações:</strong> ${order.notes || '-'}</p>
                <p><strong>Endereço:</strong> ${[order.logradouro, order.numero, order.bairro].filter(Boolean).join(', ')}</p>
                <div>
                  <p class="font-medium">Itens</p>
                  <ul class="mt-1 space-y-1">${itemsHtml || '<li class="text-sm text-gray-500">Sem itens</li>'}</ul>
                </div>
              </div>
            `;
          } catch (e) {
            body.innerHTML = '<p class="text-sm text-red-600">Erro ao carregar pedido.</p>';
          }
        });
      });
    });
  }

  // Evita recarregar a página ao clicar na aba atual
  if (nav) {
    nav.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a.admin-tab-button');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (window.location.pathname === href) {
        e.preventDefault();
        return;
      }
      // Para atendente: bloquear abas que não são clientes
      const isAdmin = role === 'admin';
      if (!isAdmin && href !== '/admin/clientes' && href !== '/admin/telefones') {
        e.preventDefault();
        return;
      }
    });
  }
}
