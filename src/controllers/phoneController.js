const DAO = require('../server/dao');

class PhoneController {
  static async list(req, res) {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const pageSize = parseInt(req.query.pageSize || '20', 10);
      const search = req.query.search || '';
      const data = await DAO.listAllPhones({ page, pageSize, search });
      res.json(data);
    } catch (e) {
      console.error('[PhoneController.list]', e);
      res.status(500).json({ error: 'Erro ao listar telefones' });
    }
  }

  static async create(req, res) {
    try {
      const { client_id, numero } = req.body || {};
      if (!client_id || !numero) return res.status(400).json({ error: 'client_id e numero são obrigatórios' });
      const result = await DAO.addPhone(client_id, numero);
      res.json({ success: true, ...result });
    } catch (e) {
      console.error('[PhoneController.create]', e);
      res.status(500).json({ error: 'Erro ao criar telefone' });
    }
  }

  static async update(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const { numero } = req.body || {};
      if (!id || !numero) return res.status(400).json({ error: 'id e numero são obrigatórios' });
      await DAO.updatePhone(id, numero);
      res.json({ success: true });
    } catch (e) {
      console.error('[PhoneController.update]', e);
      res.status(500).json({ error: 'Erro ao atualizar telefone' });
    }
  }

  static async remove(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (!id) return res.status(400).json({ error: 'id inválido' });
      await DAO.deletePhone(id);
      res.json({ success: true });
    } catch (e) {
      console.error('[PhoneController.remove]', e);
      res.status(500).json({ error: 'Erro ao apagar telefone' });
    }
  }
}

module.exports = PhoneController;
