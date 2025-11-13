export function initAdmin() {
  const usersTbody = document.getElementById('users-table-body');
  const logsTbody = document.getElementById('logs-table-body');
  const nav = document.getElementById('admin-nav');

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
        </tr>`;
      }).join('');
    });
  }

  // Listener do nav fora do template para não vazar na UI
  if (nav) {
    nav.addEventListener('click', (e) => {
      if (e.target.matches('a.admin-tab-button')) {
        // Links já navegam; nada a fazer aqui.
      }
    });
  }
}
