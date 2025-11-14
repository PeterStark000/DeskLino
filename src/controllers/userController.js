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

  static async updateRole(req, res) {
    try {
      const id = Number(req.params.id);
      const { role } = req.body || {};
      if (!id || !role) return res.status(400).json({ error: 'ID e role são obrigatórios' });
      const allowed = ['admin', 'atendente'];
      if (!allowed.includes(role)) return res.status(400).json({ error: 'Role inválido' });
      // Proteção: conta admin do sistema não pode ser alterada
      const target = await DAO.getUserById(id);
      if (!target) return res.status(404).json({ error: 'Usuário não encontrado' });
      const protectedUsernames = ['admin', 'admin.user'];
      if (target.id === 1 || protectedUsernames.includes(String(target.username).toLowerCase())) {
        return res.status(403).json({ error: 'A conta admin do sistema não pode ter o nível alterado' });
      }
      await DAO.updateUserRole(id, role);
      return res.json({ success: true });
    } catch (error) {
      console.error('[UserController.updateRole]', error);
      res.status(500).json({ error: 'Erro ao atualizar nível de acesso' });
    }
  }
}

module.exports = UserController;
