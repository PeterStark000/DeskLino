const mysql = require('mysql2/promise');

/**
 * Configuração da conexão MySQL
 * IMPORTANTE: Configure as variáveis de ambiente ou substitua pelos valores reais
 */
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'desklino',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Pool de conexões (recomendado para produção)
const pool = mysql.createPool(dbConfig);

/**
 * Testa a conexão com o banco de dados
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✓ Conectado ao MySQL com sucesso!');
    connection.release();
    return true;
  } catch (error) {
    console.error('✗ Erro ao conectar ao MySQL:', error.message);
    return false;
  }
}

/**
 * Executa uma query genérica
 * @param {string} sql - Query SQL
 * @param {Array} params - Parâmetros para prepared statement
 * @returns {Promise<Array>} Resultados da query
 */
async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Erro na query:', error.message);
    throw error;
  }
}

// =============================================================================
// FUNÇÕES DE ACESSO AO BANCO (IMPLEMENTAR CONFORME SCHEMA)
// =============================================================================

/**
 * TODO: Implementar busca de usuário por username
 * Schema sugerido tabela `usuarios`: id, username, name, password_hash, role
 */
async function getUserByUsername(username) {
  // const sql = 'SELECT id, username, name, role FROM usuarios WHERE username = ?';
  // return await query(sql, [username]);
  throw new Error('getUserByUsername: Implementação pendente');
}

/**
 * TODO: Implementar listagem de todos os usuários
 */
async function getAllUsers() {
  // const sql = 'SELECT id, username, name, role FROM usuarios';
  // return await query(sql);
  throw new Error('getAllUsers: Implementação pendente');
}

/**
 * TODO: Implementar atualização de role de usuário
 */
async function updateUserRole(userId, newRole) {
  // const sql = 'UPDATE usuarios SET role = ? WHERE id = ?';
  // return await query(sql, [newRole, userId]);
  throw new Error('updateUserRole: Implementação pendente');
}

/**
 * TODO: Implementar busca de cliente por telefone
 * Schema sugerido tabela `clientes`: id, phone, name, address, bairro, ref, notes
 */
async function getClientByPhone(phone) {
  // const sql = 'SELECT * FROM clientes WHERE phone = ?';
  // return await query(sql, [phone]);
  throw new Error('getClientByPhone: Implementação pendente');
}

/**
 * TODO: Implementar criação de novo cliente
 */
async function createClient(clientData) {
  // const sql = 'INSERT INTO clientes (phone, name, address, bairro, ref, notes) VALUES (?, ?, ?, ?, ?, ?)';
  // const { phone, name, address, bairro, ref, notes } = clientData;
  // return await query(sql, [phone, name, address, bairro, ref, notes]);
  throw new Error('createClient: Implementação pendente');
}

/**
 * TODO: Implementar atualização de observações do cliente
 */
async function updateClientNotes(clientId, notes) {
  // const sql = 'UPDATE clientes SET notes = ? WHERE id = ?';
  // return await query(sql, [notes, clientId]);
  throw new Error('updateClientNotes: Implementação pendente');
}

/**
 * TODO: Implementar exclusão de cliente
 */
async function deleteClient(clientId) {
  // const sql = 'DELETE FROM clientes WHERE id = ?';
  // return await query(sql, [clientId]);
  throw new Error('deleteClient: Implementação pendente');
}

/**
 * TODO: Implementar busca de histórico de pedidos de um cliente
 * Schema sugerido tabela `pedidos`: id, client_id, product, quantity, status, created_at
 */
async function getClientOrderHistory(clientId) {
  // const sql = 'SELECT * FROM pedidos WHERE client_id = ? ORDER BY created_at DESC LIMIT 10';
  // return await query(sql, [clientId]);
  throw new Error('getClientOrderHistory: Implementação pendente');
}

/**
 * TODO: Implementar criação de novo pedido
 * Nota: orderData deve conter client_id e um array de itens (produtos)
 */
async function createOrder(orderData) {
  // Exemplo de estrutura para múltiplos produtos:
  // const { client_id, items, notes } = orderData;
  // items = [{ product: 'Botijão P13', quantity: 2 }, { product: 'Água 20L', quantity: 1 }]
  // 
  // Inserir pedido principal e depois itens em tabela `pedido_itens`
  // const sqlOrder = 'INSERT INTO pedidos (client_id, notes, status) VALUES (?, ?, ?)';
  // const result = await query(sqlOrder, [client_id, notes, 'pendente']);
  // const orderId = result.insertId;
  //
  // for (const item of items) {
  //   const sqlItem = 'INSERT INTO pedido_itens (order_id, product, quantity) VALUES (?, ?, ?)';
  //   await query(sqlItem, [orderId, item.product, item.quantity]);
  // }
  // return orderId;
  throw new Error('createOrder: Implementação pendente');
}

/**
 * TODO: Implementar listagem de logs de auditoria
 * Schema sugerido tabela `logs`: id, datetime, user, type, detail
 */
async function getAllLogs() {
  // const sql = 'SELECT * FROM logs ORDER BY datetime DESC LIMIT 50';
  // return await query(sql);
  throw new Error('getAllLogs: Implementação pendente');
}

/**
 * TODO: Implementar criação de log de auditoria
 */
async function createLog(logData) {
  // const sql = 'INSERT INTO logs (user, type, detail) VALUES (?, ?, ?)';
  // const { user, type, detail } = logData;
  // return await query(sql, [user, type, detail]);
  throw new Error('createLog: Implementação pendente');
}

/**
 * TODO: Implementar listagem de produtos disponíveis
 * Schema sugerido tabela `produtos`: id, name, price, available
 */
async function getAllProducts() {
  // const sql = 'SELECT * FROM produtos WHERE available = 1';
  // return await query(sql);
  throw new Error('getAllProducts: Implementação pendente');
}

// Exporta pool e funções
module.exports = {
  pool,
  testConnection,
  query,
  // Usuários
  getUserByUsername,
  getAllUsers,
  updateUserRole,
  // Clientes
  getClientByPhone,
  createClient,
  updateClientNotes,
  deleteClient,
  // Pedidos
  getClientOrderHistory,
  createOrder,
  // Logs
  getAllLogs,
  createLog,
  // Produtos
  getAllProducts
};
