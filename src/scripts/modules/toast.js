/**
 * Sistema de notificações Toast usando Flowbite + Tailwind
 */

let toastIdCounter = 0;

function getToastContainer() {
  // Se houver um <dialog open>, criamos/usa um container dentro dele para ficar no top layer
  const openDialog = document.querySelector('dialog[open]');
  if (openDialog) {
    let modalContainer = openDialog.querySelector('#toast-container-toplayer');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'toast-container-toplayer';
      modalContainer.className = 'fixed top-5 right-5 z-[100000] flex flex-col items-end pointer-events-none';
      openDialog.appendChild(modalContainer);
    }
    return modalContainer;
  }
  // Caso contrário, usa o container global
  return document.getElementById('toast-container');
}

/**
 * Exibe uma notificação toast
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duração em ms (0 = não fecha automaticamente)
 */
export function showToast(message, type = 'info', duration = 4000) {
  const container = getToastContainer();
  if (!container) {
    console.error('Toast container não encontrado no DOM');
    return;
  }

  const toastId = `toast-${toastIdCounter++}`;
  
  // Configurações por tipo (Flowbite style)
  const config = {
    success: {
      bgColor: 'bg-white',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-500',
      borderColor: 'border-gray-200',
      icon: '<svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 11.917 9.724 16.5 19 7.5"/></svg>'
    },
    error: {
      bgColor: 'bg-white',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-500',
      borderColor: 'border-gray-200',
      icon: '<svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6"/></svg>'
    },
    warning: {
      bgColor: 'bg-white',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-500',
      borderColor: 'border-gray-200',
      icon: '<svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 13V8m0 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>'
    },
    info: {
      bgColor: 'bg-white',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-500',
      borderColor: 'border-gray-200',
      icon: '<svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 11h2v5m-2 0h4m-2.592-8.5h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>'
    }
  };

  const typeConfig = config[type] || config.info;

  // Criar elemento toast
  const toast = document.createElement('div');
  toast.id = toastId;
  toast.className = `flex items-center w-full max-w-sm p-4 mb-4 text-gray-800 ${typeConfig.bgColor} rounded-lg shadow-lg border ${typeConfig.borderColor} transition-all duration-300 ease-in-out opacity-0 transform translate-x-full`;
  toast.setAttribute('role', 'alert');
  
  toast.innerHTML = `
    <div class="inline-flex items-center justify-center shrink-0 w-8 h-8 ${typeConfig.iconColor} ${typeConfig.iconBg} rounded-lg">
      ${typeConfig.icon}
    </div>
    <div class="ms-3 text-sm font-normal">${message}</div>
    <button type="button" class="ms-auto -mx-1.5 -my-1.5 ${typeConfig.bgColor} text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8" data-dismiss-target="#${toastId}" aria-label="Close">
      <span class="sr-only">Fechar</span>
      <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
      </svg>
    </button>
  `;

  // Permitir interação no botão mesmo com pointer-events do container desabilitado
  toast.style.pointerEvents = 'auto';
  container.appendChild(toast);

  // Animar entrada (slide in from right)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.remove('opacity-0', 'translate-x-full');
      toast.classList.add('opacity-100', 'translate-x-0');
    });
  });

  // Botão de fechar
  const closeBtn = toast.querySelector('button[data-dismiss-target]');
  closeBtn.addEventListener('click', () => dismissToast(toastId));

  // Auto-dismiss
  if (duration > 0) {
    setTimeout(() => dismissToast(toastId), duration);
  }
}

/**
 * Remove um toast do DOM com animação
 */
function dismissToast(toastId) {
  const toast = document.getElementById(toastId);
  if (!toast) return;

  toast.classList.remove('opacity-100', 'translate-x-0');
  toast.classList.add('opacity-0', 'translate-x-full');

  setTimeout(() => {
    toast.remove();
  }, 300);
}

/**
 * Exibe um toast de confirmação interativo
 * @param {string} title - Título do toast
 * @param {string} message - Mensagem descritiva
 * @param {object} options - Opções { confirmText, cancelText }
 * @returns {Promise<boolean>} - Resolve com true se confirmado, false se cancelado
 */
export function showConfirmToast(title, message, options = {}) {
  return new Promise((resolve) => {
    const container = getToastContainer();
    if (!container) {
      console.error('Toast container não encontrado no DOM');
      resolve(false);
      return;
    }

    const toastId = `toast-confirm-${toastIdCounter++}`;
    const confirmText = options.confirmText || 'Confirmar';
    const cancelText = options.cancelText || 'Cancelar';

    // Criar elemento toast de confirmação
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = 'p-3 text-gray-800 bg-white rounded-lg shadow-xl border border-gray-200 transition-all duration-300 ease-in-out opacity-0 transform translate-x-full mb-4';
    toast.style.maxWidth = '380px';
    toast.style.width = '380px';
    toast.setAttribute('role', 'alert');
    
    toast.innerHTML = `
      <div class="flex flex-col gap-3">
        <div class="flex items-start gap-3">
          <div class="inline-flex items-center justify-center shrink-0 w-9 h-9 text-orange-600 bg-orange-100 rounded-lg">
            <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 13V8m0 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            </svg>
            <span class="sr-only">Atenção</span>
          </div>
          <div class="flex-1">
            <span class="text-base font-semibold text-gray-900 block mb-1">${title}</span>
            <div class="text-sm text-gray-600 leading-relaxed">${message}</div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button type="button" data-action="cancel" class="w-full text-gray-700 bg-white box-border border border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus:ring-4 focus:ring-gray-200 shadow-sm font-medium leading-5 rounded-lg text-xs px-3 py-1.5 focus:outline-none">
            ${cancelText}
          </button>
          <button type="button" data-action="confirm" class="w-full inline-flex items-center justify-center text-white bg-red-600 hover:bg-red-700 box-border border border-transparent focus:ring-4 focus:ring-red-300 shadow-sm font-medium leading-5 rounded-lg text-xs px-3 py-1.5 focus:outline-none">
            ${confirmText}
          </button> 
        </div>
      </div>
    `;

    // Permitir interação mesmo com pointer-events desabilitado no container
    toast.style.pointerEvents = 'auto';
    container.appendChild(toast);

    // Animar entrada (slide in from right)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.remove('opacity-0', 'translate-x-full');
        toast.classList.add('opacity-100', 'translate-x-0');
      });
    });

    // Handler de botões
    const confirmBtn = toast.querySelector('button[data-action="confirm"]');
    const cancelBtn = toast.querySelector('button[data-action="cancel"]');

    const handleResponse = (confirmed) => {
      dismissToast(toastId);
      resolve(confirmed);
    };

    confirmBtn.addEventListener('click', () => handleResponse(true));
    cancelBtn.addEventListener('click', () => handleResponse(false));
  });
}

/**
 * Atalhos para tipos específicos
 */
export const toast = {
  success: (msg, duration) => showToast(msg, 'success', duration),
  error: (msg, duration) => showToast(msg, 'error', duration),
  warning: (msg, duration) => showToast(msg, 'warning', duration),
  info: (msg, duration) => showToast(msg, 'info', duration),
  confirm: (title, message, options) => showConfirmToast(title, message, options)
};

/** Persistir toast para aparecer após redirecionamento **/
export function setPendingToast(type, message, duration = 4000) {
  try {
    const payload = { type, message, duration };
    sessionStorage.setItem('pendingToast', JSON.stringify(payload));
  } catch {}
}

export function showPendingToastOnLoad() {
  try {
    const raw = sessionStorage.getItem('pendingToast');
    if (!raw) return;
    sessionStorage.removeItem('pendingToast');
    const { type, message, duration } = JSON.parse(raw);
    showToast(message, type, duration ?? 4000);
  } catch {}
}
