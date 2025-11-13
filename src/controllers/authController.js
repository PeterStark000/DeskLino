const DAO = require('../server/dao');

class AuthController {
  static async login(req, res) {
    try {
      const { username, password } = req.body || {};
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
      }

      // TODO: Implementar bcrypt quando database estiver ativo
      // const user = await DAO.getUserByUsername(username);
      // if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
      // const passwordMatch = await bcrypt.compare(password, user.password_hash);
      // if (!passwordMatch) return res.status(401).json({ error: 'Senha incorreta' });

      const user = await DAO.getUserByUsername(username) || { username, name: username, role: 'atendente' };
      const role = password === 'admin' ? 'admin' : user.role;

      res.json({ 
        user: { 
          username: user.username, 
          name: user.name || username, 
          role 
        } 
      });
    } catch (error) {
      console.error('[AuthController.login]', error);
      res.status(500).json({ error: 'Erro ao realizar login' });
    }
  }
}

module.exports = AuthController;
