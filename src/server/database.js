const mysql = require('mysql2/promise');
const mysqlFormat = require('mysql2');

// Alternância global para logar SQL no console
const ENABLE_SQL_LOG = true;

/**
 * Configuração da conexão MySQL
 */
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'desklino',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Pool de conexões
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
 */
async function query(sql, params = []) {
  try {
    if (ENABLE_SQL_LOG) {
      try {
        const formatted = mysqlFormat.format(sql, params);
        console.log('[SQL]', formatted);
      } catch (_) {
        console.log('[SQL]', sql, params);
      }
    }
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Erro na query:', error.message);
    throw error;
  }
}

/**
 * Helpers para transações
 */
async function txQuery(connection, sql, params = []) {
  if (ENABLE_SQL_LOG) {
    try {
      const formatted = mysqlFormat.format(sql, params);
      console.log('[SQL]', formatted);
    } catch (_) {
      console.log('[SQL]', sql, params);
    }
  }
  return connection.query(sql, params);
}

async function txExecute(connection, sql, params = []) {
  if (ENABLE_SQL_LOG) {
    try {
      const formatted = mysqlFormat.format(sql, params);
      console.log('[SQL]', formatted);
    } catch (_) {
      console.log('[SQL]', sql, params);
    }
  }
  return connection.execute(sql, params);
}

/**
 * Executa uma operação dentro de uma transação
 */
async function withTransaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (ENABLE_SQL_LOG) console.log('[TX] BEGIN');
    
    const result = await callback(connection);
    
    await connection.commit();
    if (ENABLE_SQL_LOG) console.log('[TX] COMMIT');
    
    return result;
  } catch (error) {
    await connection.rollback();
    if (ENABLE_SQL_LOG) console.log('[TX] ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
}

// Exporta helpers para uso nos repositories
module.exports.pool = pool;
module.exports.query = query;
module.exports.txQuery = txQuery;
module.exports.txExecute = txExecute;
module.exports.withTransaction = withTransaction;

// Importa todos os repositories
const UserRepository = require('./repositories/UserRepository');
const ClientRepository = require('./repositories/ClientRepository');
const PhoneRepository = require('./repositories/PhoneRepository');
const AddressRepository = require('./repositories/AddressRepository');
const ProductRepository = require('./repositories/ProductRepository');
const OrderRepository = require('./repositories/OrderRepository');
const AttendanceRepository = require('./repositories/AttendanceRepository');

// Exporta testConnection e todas as funções dos repositories
module.exports.testConnection = testConnection;

// Usuários
module.exports.getUserByUsername = (username) => UserRepository.findByUsername(username);
module.exports.getAllUsers = () => UserRepository.findAll();
module.exports.getUserById = (id) => UserRepository.findById(id);
module.exports.updateUserRole = (id, role) => UserRepository.updateRole(id, role);

// Clientes
module.exports.getClientByPhone = (phone) => ClientRepository.findByPhone(phone);
module.exports.searchClients = (searchTerm) => ClientRepository.search(searchTerm);
module.exports.listClients = (params) => ClientRepository.list(params);
module.exports.getClientById = (id) => ClientRepository.findById(id);
module.exports.createClient = (clientData) => ClientRepository.create(clientData);
module.exports.updateClient = (id, data) => ClientRepository.update(id, data);
module.exports.deleteClient = (id) => ClientRepository.delete(id);

// Telefones
module.exports.getClientPhones = (clientId) => PhoneRepository.findByClient(clientId);
module.exports.listAllPhones = (params) => PhoneRepository.list(params);
module.exports.addPhone = (clientId, numero) => PhoneRepository.create(clientId, numero);
module.exports.updatePhone = (id, numero) => PhoneRepository.update(id, numero);
module.exports.deletePhone = (id) => PhoneRepository.delete(id);

// Endereços
module.exports.getClientAddresses = (clientId) => AddressRepository.findByClient(clientId);
module.exports.addAddress = (clientId, address) => AddressRepository.create(clientId, address);
module.exports.updateAddress = (clientId, enderecoId, addressData) => AddressRepository.update(clientId, enderecoId, addressData);
module.exports.setPrimaryAddress = (clientId, enderecoId) => AddressRepository.setPrimary(clientId, enderecoId);
module.exports.deleteAddress = (clientId, enderecoId) => AddressRepository.delete(clientId, enderecoId);

// Produtos
module.exports.getAllProducts = () => ProductRepository.findAvailable();
module.exports.getAllProductsAdmin = () => ProductRepository.findAll();
module.exports.createProduct = (productData) => ProductRepository.create(productData);
module.exports.updateProduct = (productId, productData) => ProductRepository.update(productId, productData);

// Pedidos
module.exports.getClientOrderHistory = (clientId) => OrderRepository.findByClient(clientId);
module.exports.getOrderByAtendimento = (atendimentoId) => OrderRepository.findByAtendimento(atendimentoId);
module.exports.getOrderDetails = (orderId) => OrderRepository.findById(orderId);
module.exports.listOrders = (params) => OrderRepository.list(params);
module.exports.createOrder = (orderData) => OrderRepository.create(orderData);
module.exports.updateOrderStatus = (orderId, status) => OrderRepository.updateStatus(orderId, status);
module.exports.recalculateOrderTotal = (orderId) => OrderRepository.recalculateTotal(orderId);

// Atendimentos (Logs)
module.exports.getAllLogs = () => AttendanceRepository.findRecent(50);
module.exports.createLog = (logData) => AttendanceRepository.create(logData);
