const DAO = require('../server/dao');

class UserController {
  static async getAll(req, res) {
    try {
      const users = await DAO.getAllUsers();
      res.json({ users });
    } catch (error) {
      console.error('[UserController.getAll]', error);
      res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
  }
}

module.exports = UserController;
