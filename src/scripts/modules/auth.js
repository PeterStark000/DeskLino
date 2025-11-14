import { toast } from './toast.js';

export function initAuth() {
  const loginForm = document.getElementById('login-form');
  const atendenteNome = document.getElementById('atendente-nome');
  const userRoleDisplay = document.getElementById('user-role-display');
  const logoutButton = document.getElementById('logout-button');
  const adminToggleButton = document.getElementById('admin-toggle-button');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      const resp = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (resp.ok) {
        const data = await resp.json();
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/atendimento/idle';
      } else {
        toast.error('Usuário ou senha inválidos');
      }
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('user');
      window.location.href = '/login';
    });
  }

  // Atualiza UI com dados do usuário se existir
  const rawUser = localStorage.getItem('user');
  if (rawUser && atendenteNome && userRoleDisplay) {
    const user = JSON.parse(rawUser);
    atendenteNome.textContent = user.name;
    userRoleDisplay.textContent = user.role;
    if (adminToggleButton) {
      // Exibe o botão do painel para admin e atendente
      if (user.role === 'admin' || user.role === 'atendente') adminToggleButton.classList.remove('hidden');
      else adminToggleButton.classList.add('hidden');
    }
  }
}
