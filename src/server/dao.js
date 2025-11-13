const db = require('./database');
const { EXAMPLE_users, EXAMPLE_logs, EXAMPLE_customers, EXAMPLE_products } = require('./store');

/**
 * Data Access Object - Camada de acesso aos dados
 * Agora utilizando MySQL real conforme schema.sql
 */
class DAO {
  // ===== USUÁRIOS (Atendentes) =====
  static async getAllUsers() {
    try {
      return await db.getAllUsers();
    } catch (error) {
      console.warn('Erro ao buscar usuários do DB, usando fallback:', error.message);
      return EXAMPLE_users;
    }
  }

  static async getUserByUsername(username) {
    try {
      return await db.getUserByUsername(username);
    } catch (error) {
      console.warn('Erro ao buscar usuário do DB, usando fallback:', error.message);
      return EXAMPLE_users.find(u => u.username === username);
    }
  }

  // ===== LOGS (Atendimentos) =====
  static async getAllLogs() {
    try {
      return await db.getAllLogs();
    } catch (error) {
      console.warn('Erro ao buscar logs do DB, usando fallback:', error.message);
      return EXAMPLE_logs;
    }
  }

  static async createLog(logData) {
    try {
      return await db.createLog(logData);
    } catch (error) {
      console.warn('Erro ao criar log no DB:', error.message);
      console.log('[LOG FALLBACK]', logData);
      return { success: true };
    }
  }

  // ===== CLIENTES =====
  static async getClientByPhone(phone) {
    try {
      return await db.getClientByPhone(phone);
    } catch (error) {
      console.warn('Erro ao buscar cliente do DB, usando fallback:', error.message);
      return EXAMPLE_customers.find(c => c.phone === phone);
    }
  }

  static async createClient(clientData) {
    try {
      return await db.createClient(clientData);
    } catch (error) {
      console.error('Erro ao criar cliente no DB:', error.message);
      throw error;
    }
  }

  // ===== PRODUTOS =====
  static async getAllProducts() {
    try {
      return await db.getAllProducts();
    } catch (error) {
      console.warn('Erro ao buscar produtos do DB, usando fallback:', error.message);
      return EXAMPLE_products;
    }
  }

  // ===== PEDIDOS =====
  static async createOrder(orderData) {
    try {
      return await db.createOrder(orderData);
    } catch (error) {
      console.error('Erro ao criar pedido no DB:', error.message);
      throw error;
    }
  }

  static async getOrderHistory(clientId) {
    try {
      return await db.getClientOrderHistory(clientId);
    } catch (error) {
      console.warn('Erro ao buscar histórico do DB:', error.message);
      return [];
    }
  }
}

module.exports = DAO;
