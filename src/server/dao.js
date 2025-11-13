const db = require('./database');
const { EXAMPLE_users, EXAMPLE_logs, EXAMPLE_customers, EXAMPLE_products } = require('./store');

class DAO {
  // ===== USUÁRIOS =====
  static async getAllUsers() {
    // return await db.getAllUsers();
    return EXAMPLE_users;
  }

  static async getUserByUsername(username) {
    // return await db.getUserByUsername(username);
    return EXAMPLE_users.find(u => u.username === username);
  }

  // ===== LOGS =====
  static async getAllLogs() {
    // return await db.getAllLogs();
    return EXAMPLE_logs;
  }

  static async createLog(logData) {
    // return await db.createLog(logData);
    console.log('[LOG]', logData);
    return { success: true };
  }

  // ===== CLIENTES =====
  static async getAllClients() {
    // return await db.getAllClients();
    return EXAMPLE_customers;
  }

  static async getClientByPhone(phone) {
    // return await db.getClientByPhone(phone);
    return EXAMPLE_customers.find(c => c.phone === phone);
  }

  static async createClient(clientData) {
    // return await db.createClient(clientData);
    throw new Error('Implementação pendente - banco de dados');
  }

  // ===== PRODUTOS =====
  static async getAllProducts() {
    // return await db.getAllProducts();
    return EXAMPLE_products;
  }

  // ===== PEDIDOS =====
  static async createOrder(orderData) {
    // return await db.createOrder(orderData);
    throw new Error('Implementação pendente - banco de dados');
  }

  static async getOrderHistory(clientId) {
    // return await db.getClientOrderHistory(clientId);
    return [];
  }
}

module.exports = DAO;
