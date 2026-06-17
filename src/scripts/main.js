import { initAuth } from './modules/auth.js';
import { initAtendimento } from './modules/atendimento.js';
import { initAdmin } from './modules/admin.js';
import { showPendingToastOnLoad } from './modules/toast.js';

showPendingToastOnLoad();

initAuth();
initAtendimento();
initAdmin();
