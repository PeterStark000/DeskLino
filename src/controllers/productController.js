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

  static async getAllAdmin(req, res) {
    try {
      const products = await DAO.getAllProductsAdmin();
      res.json({ products });
    } catch (error) {
      console.error('[ProductController.getAllAdmin]', error);
      res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
  }

  static async update(req, res) {
    try {
      const productId = parseInt(req.params.id, 10);
      const productData = req.body;
      await DAO.updateProduct(productId, productData);
      res.json({ success: true });
    } catch (error) {
      console.error('[ProductController.update]', error);
      res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
  }

  static async create(req, res) {
    try {
      const productData = req.body;
      await DAO.createProduct(productData);
      res.json({ success: true });
    } catch (error) {
      console.error('[ProductController.create]', error);
      res.status(500).json({ error: 'Erro ao criar produto' });
    }
  }
}

module.exports = ProductController;
