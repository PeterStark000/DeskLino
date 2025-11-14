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

  static async getUserById(id) {
    try {
      return await db.getUserById(id);
    } catch (error) {
      console.warn('Erro ao buscar usuário por id:', error.message);
      return EXAMPLE_users.find(u => u.id === id) || null;
    }
  }

  static async updateUserRole(id, role) {
    try {
      return await db.updateUserRole(id, role);
    } catch (error) {
      console.error('Erro ao atualizar papel do usuário:', error.message);
      throw error;
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

  static async searchClients(searchTerm) {
    try {
      return await db.searchClients(searchTerm);
    } catch (error) {
      console.warn('Erro ao pesquisar clientes do DB:', error.message);
      return EXAMPLE_customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
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

  // Telefones
  static async getClientPhones(clientId) {
    try {
      return await db.getClientPhones(clientId);
    } catch (error) {
      console.error('Erro ao listar telefones:', error.message);
      throw error;
    }
  }

  static async addPhone(clientId, numero) {
    try {
      return await db.addPhone(clientId, numero);
    } catch (error) {
      console.error('Erro ao adicionar telefone:', error.message);
      throw error;
    }
  }

    // Telefones (admin)
    static async listAllPhones({ page, pageSize, search }) {
      try {
        return await db.listAllPhones({ page, pageSize, search });
      } catch (e) { throw e; }
    }

    static async updatePhone(id, numero) {
      try {
        return await db.updatePhone(id, numero);
      } catch (e) { throw e; }
    }

    static async deletePhone(id) {
      try {
        return await db.deletePhone(id);
      } catch (e) { throw e; }
    }

  // Endereços
  static async getClientAddresses(clientId) {
    try {
      return await db.getClientAddresses(clientId);
    } catch (error) {
      console.error('Erro ao listar endereços:', error.message);
      throw error;
    }
  }

  static async addAddress(clientId, address) {
    try {
      return await db.addAddress(clientId, address);
    } catch (error) {
      console.error('Erro ao adicionar endereço:', error.message);
      throw error;
    }
  }

  static async setPrimaryAddress(clientId, enderecoId) {
    try {
      return await db.setPrimaryAddress(clientId, enderecoId);
    } catch (error) {
      console.error('Erro ao definir endereço principal:', error.message);
      throw error;
    }
  }

  static async deleteAddress(clientId, enderecoId) {
    try {
      return await db.deleteAddress(clientId, enderecoId);
    } catch (error) {
      console.error('Erro ao apagar endereço:', error.message);
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

  static async getOrderByAtendimento(atendimentoId) {
    try {
      return await db.getOrderByAtendimento(atendimentoId);
    } catch (error) {
      console.error('Erro ao buscar pedido por atendimento:', error.message);
      throw error;
    }
  }

  static async listOrders({ page = 1, pageSize = 20, search = '', clientId = null, status = '' }) {
    try {
      return await db.listOrders({ page, pageSize, search, clientId, status });
    } catch (error) {
      console.error('Erro ao listar pedidos:', error.message);
      throw error;
    }
  }

  static async updateOrderStatus(orderId, status) {
    try {
      return await db.updateOrderStatus(orderId, status);
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error.message);
      throw error;
    }
  }

  // ===== CLIENTES (Admin) =====
  static async listClients({ page = 1, pageSize = 20, search = '' }) {
    return await db.listClients({ page, pageSize, search });
  }

  static async getClientById(id) {
    return await db.getClientById(id);
  }

  static async updateClient(id, data) {
    return await db.updateClient(id, data);
  }

  static async deleteClient(id) {
    return await db.deleteClient(id);
  }
}

module.exports = DAO;
