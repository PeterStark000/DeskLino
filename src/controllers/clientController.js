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
      const { phone, name, address, bairro, ref, notes, user } = req.body || {};

      if (!phone || !name || !address) {
        return res.status(400).json({ error: 'Telefone, nome e endereço são obrigatórios' });
      }

      const result = await DAO.createClient({ phone, name, address, bairro, ref, notes });
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
}

module.exports = ClientController;
