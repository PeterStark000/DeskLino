const DAO = require('../server/dao');

class LogController {
  static async getAll(req, res) {
    try {
      const logs = await DAO.getAllLogs();
      res.json({ logs });
    } catch (error) {
      console.error('[LogController.getAll]', error);
      res.status(500).json({ error: 'Erro ao buscar logs' });
    }
  }
}

module.exports = LogController;
