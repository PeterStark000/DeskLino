const path = require('path');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use('/static', express.static(path.join(__dirname, 'src')));

// Database connection
const db = require('./src/server/database');
const { EXAMPLE_users, EXAMPLE_logs, EXAMPLE_customers, EXAMPLE_products } = require('./src/server/store');

/**
 * Função centralizada para carregar dados
 * Por enquanto usa store.js (EXAMPLE_*), mas pode ser facilmente alterada
 * para usar o banco de dados quando estiver pronto.
 * 
 * Para migrar para o banco, basta descomentar as linhas com db.* e 
 * comentar as linhas com EXAMPLE_*
 */
const loadDataFromDatabase = {
  // Usuários
  async getUsers() {
    // return await db.getAllUsers();
    return EXAMPLE_users;
  },
  
  async getUserByUsername(username) {
    // return await db.getUserByUsername(username);
    return EXAMPLE_users.find(u => u.username === username);
  },
  
  // Logs
  async getLogs() {
    // return await db.getAllLogs();
    return EXAMPLE_logs;
  },
  
  // Clientes
  async getCustomers() {
    // return await db.getAllClients();
    return EXAMPLE_customers;
  },
  
  async getCustomerByPhone(phone) {
    // return await db.getClientByPhone(phone);
    return EXAMPLE_customers.find(c => c.phone === phone);
  },
  
  // Produtos
  async getProducts() {
    // return await db.getAllProducts();
    return EXAMPLE_products;
  },
  
  // Pedidos
  async createOrder(orderData) {
    // return await db.createOrder(orderData);
    throw new Error('Implementação pendente - banco de dados');
  },
  
  async createClient(clientData) {
    // return await db.createClient(clientData);
    throw new Error('Implementação pendente - banco de dados');
  },
  
  async createLog(logData) {
    // return await db.createLog(logData);
    console.log('[LOG]', logData);
  }
};

// Helper para renderizar layout simples substituindo placeholders
function render(templatePath, params = {}) {
  const fs = require('fs');
  const layoutPath = path.join(__dirname, 'src', 'pages', 'layout.html');
  const layout = fs.readFileSync(layoutPath, 'utf-8');
  const content = fs.readFileSync(templatePath, 'utf-8');
  return layout
    .replace('{{title}}', params.title || 'Picolino Gás')
    .replace('{{content}}', content);
}

// Rotas de páginas
app.get('/', (req, res) => res.redirect('/login'));
app.get('/login', (req, res) => {
  const html = render(path.join(__dirname, 'src', 'pages', 'login.html'), { title: 'Login' });
  res.send(html);
});

app.get('/atendimento/idle', (req, res) => {
  const html = render(path.join(__dirname, 'src', 'pages', 'atendimento_idle.html'), { title: 'Atendimento - Ocioso' });
  res.send(html);
});
app.get('/atendimento/identificado', (req, res) => {
  const html = render(path.join(__dirname, 'src', 'pages', 'atendimento_identificado.html'), { title: 'Atendimento - Identificado' });
  res.send(html);
});
app.get('/atendimento/novo', (req, res) => {
  const html = render(path.join(__dirname, 'src', 'pages', 'atendimento_novo.html'), { title: 'Atendimento - Novo Cliente' });
  res.send(html);
});

app.get('/admin/usuarios', (req, res) => {
  const html = render(path.join(__dirname, 'src', 'pages', 'admin_usuarios.html'), { title: 'Admin - Usuários' });
  res.send(html);
});
app.get('/admin/logs', (req, res) => {
  const html = render(path.join(__dirname, 'src', 'pages', 'admin_logs.html'), { title: 'Admin - Logs' });
  res.send(html);
});

// APIs
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};
  
  try {
    // TODO: Implementar autenticação real com banco de dados
    // const user = await loadDataFromDatabase.getUserByUsername(username);
    // if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
    // 
    // Verificar password_hash (usar bcrypt):
    // const passwordMatch = await bcrypt.compare(password, user.password_hash);
    // if (!passwordMatch) return res.status(401).json({ error: 'Senha incorreta' });
    
    // FALLBACK TEMPORÁRIO (remover quando DB estiver pronto):
    const user = await loadDataFromDatabase.getUserByUsername(username) || { username, name: username, role: 'atendente' };
    const role = password === 'admin' ? 'admin' : user.role;
    return res.json({ user: { username: user.username, name: user.name || username, role } });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

app.get('/api/usuarios', async (req, res) => {
  try {
    const users = await loadDataFromDatabase.getUsers();
    res.json({ users });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

app.get('/api/logs', async (req, res) => {
  try {
    const logs = await loadDataFromDatabase.getLogs();
    res.json({ logs });
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    res.status(500).json({ error: 'Erro ao buscar logs' });
  }
});

app.get('/api/clientes/:telefone', async (req, res) => {
  try {
    const tel = decodeURIComponent(req.params.telefone);
    
    const customer = await loadDataFromDatabase.getCustomerByPhone(tel);
    if (!customer) return res.status(404).json({ error: 'Cliente não encontrado' });
    
    // TODO: Buscar histórico de pedidos do cliente
    // const history = await db.getClientOrderHistory(customer.id);
    // customer.history = history;
    
    res.json({ customer });
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ error: 'Erro ao buscar cliente' });
  }
});

app.get('/api/produtos', async (req, res) => {
  try {
    const products = await loadDataFromDatabase.getProducts();
    res.json({ products });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

app.post('/api/pedidos', async (req, res) => {
  try {
    const { client_id, items, notes, user } = req.body;
    // items = [{ product: 'Botijão P13', quantity: 2 }, ...]
    
    const orderId = await loadDataFromDatabase.createOrder({ client_id, items, notes });
    await loadDataFromDatabase.createLog({ user, type: 'PEDIDO', detail: `Pedido #${orderId} criado` });
    
    res.json({ success: true, orderId });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar pedido' });
  }
});

app.post('/api/clientes', async (req, res) => {
  try {
    const clientData = req.body; // { phone, name, address, bairro, ref, notes, user }
    const result = await loadDataFromDatabase.createClient(clientData);
    await loadDataFromDatabase.createLog({ user: clientData.user, type: 'CADASTRO', detail: `Cliente ${clientData.phone} cadastrado` });
    
    res.json({ success: true, clientId: result.insertId });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar cliente' });
  }
});

// Start server e testa conexão DB
app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);
  await db.testConnection();
});