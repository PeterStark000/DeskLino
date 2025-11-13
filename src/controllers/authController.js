const DAO = require('../server/dao');

class AuthController {
  static async login(req, res) {
    try {
      const { username, password } = req.body || {};
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
      }

      const user = await DAO.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }

      // Validação de senha (atualmente comparação direta, depois implementar bcrypt)
      if (user.password_hash !== password) {
        return res.status(401).json({ error: 'Senha incorreta' });
      }

      res.json({ 
        user: { 
          id: user.id,
          username: user.username, 
          name: user.name, 
          role: user.role
        } 
      });
    } catch (error) {
      console.error('[AuthController.login]', error);
      res.status(500).json({ error: 'Erro ao realizar login' });
    }
  }
}

module.exports = AuthController;
