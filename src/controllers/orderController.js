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
}

module.exports = OrderController;
