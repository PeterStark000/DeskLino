const DAO = require('../server/dao');

class ClientController {
  static async getByPhone(req, res) {
    try {
      const phone = decodeURIComponent(req.params.telefone);
      
      if (!phone) {
        return res.status(400).json({ error: 'Telefone é obrigatório' });
      }

      const customer = await DAO.getClientByPhone(phone);
      
      if (!customer) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      // TODO: Buscar histórico quando database estiver ativo
      // const history = await DAO.getOrderHistory(customer.id);
      // customer.history = history;

      res.json({ customer });
    } catch (error) {
      console.error('[ClientController.getByPhone]', error);
      res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
  }

  static async create(req, res) {
    try {
      const { phone, name, address, number, complemento, bairro, ref, notes, user, email, tipo_cliente, documento } = req.body || {};

      if (!phone || !name || !address) {
        return res.status(400).json({ error: 'Telefone, nome e endereço são obrigatórios' });
      }

      const result = await DAO.createClient({ phone, name, email, address, number, complemento, bairro, ref, notes, tipo_cliente, documento });
      await DAO.createLog({ 
        user, 
        type: 'CADASTRO', 
        detail: `Cliente ${phone} cadastrado` 
      });

      res.json({ success: true, clientId: result.insertId });
    } catch (error) {
      console.error('[ClientController.create]', error);
      res.status(500).json({ error: error.message || 'Erro ao criar cliente' });
    }
  }

  static async search(req, res) {
    try {
      const searchTerm = req.query.q || '';
      
      if (!searchTerm || searchTerm.length < 3) {
        return res.status(400).json({ error: 'Digite pelo menos 3 caracteres para buscar' });
      }

      const customers = await DAO.searchClients(searchTerm);
      res.json({ customers });
    } catch (error) {
      console.error('[ClientController.search]', error);
      res.status(500).json({ error: 'Erro ao buscar clientes' });
    }
  }

  // === Telefones ===
  static async listPhones(req, res) {
    try {
      const clientId = parseInt(req.params.id, 10);
      const phones = await DAO.getClientPhones(clientId);
      res.json({ phones });
    } catch (e) {
      console.error('[ClientController.listPhones]', e);
      res.status(500).json({ error: 'Erro ao listar telefones' });
    }
  }

  static async addPhone(req, res) {
    try {
      const clientId = parseInt(req.params.id, 10);
      const { numero } = req.body || {};
      if (!numero) return res.status(400).json({ error: 'Número é obrigatório' });
      const result = await DAO.addPhone(clientId, numero);
      res.json({ success: true, ...result });
    } catch (e) {
      console.error('[ClientController.addPhone]', e);
      res.status(500).json({ error: 'Erro ao adicionar telefone' });
    }
  }

  // === Endereços ===
  static async listAddresses(req, res) {
    try {
      const clientId = parseInt(req.params.id, 10);
      const addresses = await DAO.getClientAddresses(clientId);
      res.json({ addresses });
    } catch (e) {
      console.error('[ClientController.listAddresses]', e);
      res.status(500).json({ error: 'Erro ao listar endereços' });
    }
  }

  static async addAddress(req, res) {
    try {
      const clientId = parseInt(req.params.id, 10);
      const { nome_end, logradouro, numero, complemento, bairro, ponto_ref, principal } = req.body || {};
      if (!nome_end || !logradouro || !numero || !bairro) {
        return res.status(400).json({ error: 'Campos obrigatórios: nome_end, logradouro, numero, bairro' });
      }
      await DAO.addAddress(clientId, { nome_end, logradouro, numero, complemento, bairro, ponto_ref, principal });
      res.json({ success: true });
    } catch (e) {
      console.error('[ClientController.addAddress]', e);
      res.status(500).json({ error: 'Erro ao adicionar endereço' });
    }
  }

  static async setPrimaryAddress(req, res) {
    try {
      const clientId = parseInt(req.params.id, 10);
      const enderecoId = parseInt(req.params.enderecoId, 10);
      await DAO.setPrimaryAddress(clientId, enderecoId);
      res.json({ success: true });
    } catch (e) {
      console.error('[ClientController.setPrimaryAddress]', e);
      res.status(500).json({ error: 'Erro ao definir endereço principal' });
    }
  }

  static async deleteAddress(req, res) {
    try {
      const clientId = parseInt(req.params.id, 10);
      const enderecoId = parseInt(req.params.enderecoId, 10);
      await DAO.deleteAddress(clientId, enderecoId);
      res.json({ success: true });
    } catch (e) {
      console.error('[ClientController.deleteAddress]', e);
      res.status(500).json({ error: e.message || 'Erro ao apagar endereço' });
    }
  }

  // === Histórico de Pedidos ===
  static async getOrderHistory(req, res) {
    try {
      const clientId = parseInt(req.params.id, 10);
      if (isNaN(clientId)) return res.status(400).json({ error: 'ID inválido' });
      const history = await DAO.getOrderHistory(clientId);
      res.json({ history });
    } catch (e) {
      console.error('[ClientController.getOrderHistory]', e);
      res.status(500).json({ error: 'Erro ao buscar histórico de pedidos' });
    }
  }
}

module.exports = ClientController;
