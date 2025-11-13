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
const OrderController = require('./src/controllers/orderController');

// Middlewares
app.use(express.json());
app.use('/static', express.static(path.join(__dirname, 'src')));

// Helper para renderizar páginas
function renderPage(fileName, title = 'Picolino Gás') {
  const layoutPath = path.join(__dirname, 'src', 'pages', 'layout.html');
  const contentPath = path.join(__dirname, 'src', 'pages', fileName);
  const layout = fs.readFileSync(layoutPath, 'utf-8');
  const content = fs.readFileSync(contentPath, 'utf-8');
  return layout
    .replace('{{title}}', title)
    .replace('{{content}}', content);
}

// ===== ROTAS DE PÁGINAS =====
const pages = [
  { path: '/', redirect: '/login' },
  { path: '/login', file: 'login.html', title: 'Login' },
  { path: '/atendimento/idle', file: 'atendimento_idle.html', title: 'Atendimento - Ocioso' },
  { path: '/atendimento/identificado', file: 'atendimento_identificado.html', title: 'Atendimento - Identificado' },
  { path: '/atendimento/novo', file: 'atendimento_novo.html', title: 'Atendimento - Novo Cliente' },
  { path: '/admin/usuarios', file: 'admin_usuarios.html', title: 'Admin - Usuários' },
  { path: '/admin/logs', file: 'admin_logs.html', title: 'Admin - Logs' },
  { path: '/admin/clientes', file: 'admin_clientes.html', title: 'Admin - Clientes' }
];

pages.forEach(({ path, redirect, file, title }) => {
  if (redirect) {
    app.get(path, (req, res) => res.redirect(redirect));
  } else {
    app.get(path, (req, res) => res.send(renderPage(file, title)));
  }
});

// ===== ROTAS API (usando Controllers com padrão DAO) =====
app.post('/api/login', AuthController.login);
app.get('/api/usuarios', UserController.getAll);
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
app.put('/api/clientes/:id/enderecos/:enderecoId/principal', ClientController.setPrimaryAddress);
app.delete('/api/clientes/:id/enderecos/:enderecoId', ClientController.deleteAddress);
app.get('/api/clientes/:id/pedidos', ClientController.getOrderHistory);
app.get('/api/produtos', ProductController.getAll);
app.post('/api/pedidos', OrderController.create);
app.get('/api/atendimentos/:id/pedido', OrderController.getByAtendimento);

// Start server e testa conexão DB
app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);
  await db.testConnection();
});