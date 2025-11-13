const DAO = require('../server/dao');

class ProductController {
  static async getAll(req, res) {
    try {
      const products = await DAO.getAllProducts();
      res.json({ products });
    } catch (error) {
      console.error('[ProductController.getAll]', error);
      res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
  }
}

module.exports = ProductController;
