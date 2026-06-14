const path = require('path');
const express = require('express');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// Database e Controllers
const db = require('./src/server/database');
const AuthController = require('./src/controllers/authController');
const UserController = require('./src/controllers/userController');
const LogController = require('./src/controllers/logController');
const ClientController = require('./src/controllers/clientController');
const ProductController = require('./src/controllers/productController');
const PhoneController = require('./src/controllers/phoneController');
const OrderController = require('./src/controllers/orderController');

// Middlewares
app.use(express.json());
app.use('/static', express.static(path.join(__dirname, 'src')));

// ===== Partials reutilizáveis (header e navegação) =====
const PARTIALS_DIR = path.join(__dirname, 'src', 'pages', 'partials');
const partialCache = {};

function readPartial(fileName) {
  if (!partialCache[fileName]) {
    partialCache[fileName] = fs.readFileSync(path.join(PARTIALS_DIR, fileName), 'utf-8');
  }
  return partialCache[fileName];
}

// Classes de estilo para as abas do menu administrativo
const TAB_ACTIVE = 'border-blue-600 text-blue-700 font-semibold';
const TAB_INACTIVE = 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';

// Monta o menu de navegação do painel administrativo, destacando a aba ativa
function renderAdminNav(activeTab) {
  const tabs = ['usuarios', 'logs', 'clientes', 'telefones', 'pedidos', 'produtos'];
  let nav = readPartial('admin_nav.html');
  tabs.forEach((tab) => {
    nav = nav.replace(`{{tab_${tab}}}`, tab === activeTab ? TAB_ACTIVE : TAB_INACTIVE);
  });
  return nav;
}

// Helper para renderizar páginas a partir do layout + partials + conteúdo
function renderPage(fileName, title = 'Picolino Gás', options = {}) {
  const layoutPath = path.join(__dirname, 'src', 'pages', 'layout.html');
  const contentPath = path.join(__dirname, 'src', 'pages', fileName);
  const layout = fs.readFileSync(layoutPath, 'utf-8');
  let content = fs.readFileSync(contentPath, 'utf-8');

  // Injeta o header apropriado (admin, atendimento com/sem botão voltar)
  const headerPartial = options.header ? readPartial(options.header) : '';
  content = content.replace('{{header}}', headerPartial);

  // Injeta a navegação do painel admin, marcando a aba ativa
  if (options.activeTab) {
    content = content.replace('{{adminNav}}', renderAdminNav(options.activeTab));
  }

  return layout
    .replace('{{title}}', title)
    .replace('{{content}}', content);
}

// ===== ROTAS DE PÁGINAS =====
const pages = [
  { path: '/', redirect: '/login' },
  { path: '/login', file: 'login.html', title: 'Login' },
  { path: '/atendimento/idle', file: 'atendimento_idle.html', title: 'Atendimento - Ocioso', header: 'header_idle.html' },
  { path: '/atendimento/identificado', file: 'atendimento_identificado.html', title: 'Atendimento - Identificado', header: 'header_call.html' },
  { path: '/atendimento/novo', file: 'atendimento_novo.html', title: 'Atendimento - Novo Cliente', header: 'header_call.html' },
  { path: '/admin/usuarios', file: 'admin_usuarios.html', title: 'Admin - Usuários', header: 'header_admin.html', activeTab: 'usuarios' },
  { path: '/admin/logs', file: 'admin_logs.html', title: 'Admin - Logs', header: 'header_admin.html', activeTab: 'logs' },
  { path: '/admin/clientes', file: 'admin_clientes.html', title: 'Admin - Clientes', header: 'header_admin.html', activeTab: 'clientes' },
  { path: '/admin/telefones', file: 'admin_telefones.html', title: 'Admin - Telefones', header: 'header_admin.html', activeTab: 'telefones' },
  { path: '/admin/pedidos', file: 'admin_pedidos.html', title: 'Admin - Pedidos', header: 'header_admin.html', activeTab: 'pedidos' },
  { path: '/admin/produtos', file: 'admin_produtos.html', title: 'Admin - Produtos', header: 'header_admin.html', activeTab: 'produtos' }
];

pages.forEach(({ path, redirect, file, title, header, activeTab }) => {
  if (redirect) {
    app.get(path, (req, res) => res.redirect(redirect));
  } else {
    app.get(path, (req, res) => res.send(renderPage(file, title, { header, activeTab })));
  }
});

// ===== ROTAS API  =====
app.post('/api/login', AuthController.login);
app.get('/api/usuarios', UserController.getAll);
app.put('/api/usuarios/:id/role', UserController.updateRole);
app.get('/api/logs', LogController.getAll);
app.get('/api/clientes/search', ClientController.search);
app.get('/api/clientes', ClientController.list);
app.get('/api/clientes/id/:id', ClientController.getById);
app.get('/api/clientes/:telefone', ClientController.getByPhone);
app.post('/api/clientes', ClientController.create);
app.put('/api/clientes/:id', ClientController.update);
app.delete('/api/clientes/:id', ClientController.remove);

// Telefones
app.get('/api/clientes/:id/telefones', ClientController.listPhones);
app.post('/api/clientes/:id/telefones', ClientController.addPhone);

// Endereços
app.get('/api/clientes/:id/enderecos', ClientController.listAddresses);
app.post('/api/clientes/:id/enderecos', ClientController.addAddress);
app.put('/api/clientes/:id/enderecos/:enderecoId', ClientController.updateAddress);
app.put('/api/clientes/:id/enderecos/:enderecoId/principal', ClientController.setPrimaryAddress);
app.delete('/api/clientes/:id/enderecos/:enderecoId', ClientController.deleteAddress);
app.get('/api/clientes/:id/pedidos', ClientController.getOrderHistory);

// Produtos
app.get('/api/produtos', ProductController.getAll);
app.get('/api/produtos/admin', ProductController.getAllAdmin);
app.post('/api/produtos', ProductController.create);
app.put('/api/produtos/:id', ProductController.update);
app.post('/api/pedidos', OrderController.create);
app.get('/api/atendimentos/:id/pedido', OrderController.getByAtendimento);

// Pedidos (admin)
app.get('/api/pedidos', OrderController.list);
app.get('/api/pedidos/:id/detalhes', OrderController.getDetails);
app.put('/api/pedidos/:id/status', OrderController.updateStatus);
app.put('/api/pedidos/:id/corrigir-valor', OrderController.correctTotal);

// Telefones (admin)
app.get('/api/telefones', PhoneController.list);
app.post('/api/telefones', PhoneController.create);
app.put('/api/telefones/:id', PhoneController.update);
app.delete('/api/telefones/:id', PhoneController.remove);

// Start server e testa conexão DB
app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);
  await db.testConnection();
});