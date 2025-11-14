const DAO = require('../server/dao');

class OrderController {
  static async create(req, res) {
    try {
      const { client_id, items, notes, user } = req.body || {};

      if (!client_id || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Cliente e itens são obrigatórios' });
      }

      const orderId = await DAO.createOrder({ client_id, items, notes });
      await DAO.createLog({ 
        user, 
        type: 'PEDIDO', 
        detail: `Pedido #${orderId} criado` 
      });

      res.json({ success: true, orderId });
    } catch (error) {
      console.error('[OrderController.create]', error);
      res.status(500).json({ error: error.message || 'Erro ao criar pedido' });
    }
  }

  static async getByAtendimento(req, res) {
    try {
      const atendimentoId = parseInt(req.params.id, 10);
      if (!atendimentoId) return res.status(400).json({ error: 'ID de atendimento inválido' });

      const order = await DAO.getOrderByAtendimento(atendimentoId);
      if (!order) return res.status(404).json({ error: 'Pedido não encontrado para este atendimento' });

      return res.json({ order });
    } catch (error) {
      console.error('[OrderController.getByAtendimento]', error);
      res.status(500).json({ error: 'Erro ao buscar pedido do atendimento' });
    }
  }

  static async list(req, res) {
    try {
      const { page = 1, pageSize = 20, search = '', clientId = '', status = '' } = req.query || {};
      const data = await DAO.listOrders({
        page: Number(page) || 1,
        pageSize: Number(pageSize) || 20,
        search: String(search || ''),
        clientId: clientId ? Number(clientId) : null,
        status: String(status || '')
      });
      res.json(data);
    } catch (error) {
      console.error('[OrderController.list]', error);
      res.status(500).json({ error: 'Erro ao listar pedidos' });
    }
  }

  static async updateStatus(req, res) {
    try {
      const id = Number(req.params.id);
      const { status } = req.body || {};
      if (!id || !status) return res.status(400).json({ error: 'ID e status são obrigatórios' });
      await DAO.updateOrderStatus(id, status);
      res.json({ success: true });
    } catch (error) {
      console.error('[OrderController.updateStatus]', error);
      res.status(500).json({ error: 'Erro ao atualizar status do pedido' });
    }
  }
}

module.exports = OrderController;
