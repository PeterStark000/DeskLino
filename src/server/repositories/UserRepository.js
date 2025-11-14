const { query } = require('../database');

/**
 * Repository para gerenciar Atendentes (usuários do sistema)
 */
class UserRepository {
  /**
   * Busca usuário por login
   */
  static async findByUsername(username) {
    const sql = `
      SELECT 
        cod_atendente as id, 
        login as username, 
        nome as name, 
        senha as password_hash, 
        tipo_usuario as role 
      FROM Atendente 
      WHERE login = ? 
      LIMIT 1
    `;
    const rows = await query(sql, [username]);
    return rows[0] || null;
  }

  /**
   * Busca usuário por ID
   */
  static async findById(id) {
    const sql = `
      SELECT 
        cod_atendente as id, 
        login as username, 
        nome as name, 
        tipo_usuario as role 
      FROM Atendente 
      WHERE cod_atendente = ? 
      LIMIT 1
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  }

  /**
   * Lista todos os usuários
   */
  static async findAll() {
    const sql = `
      SELECT 
        cod_atendente as id, 
        login as username, 
        nome as name, 
        tipo_usuario as role 
      FROM Atendente 
      ORDER BY nome
    `;
    return await query(sql);
  }

  /**
   * Atualiza o papel/nível de acesso de um usuário
   */
  static async updateRole(id, role) {
    const allowedRoles = ['admin', 'atendente'];
    if (!allowedRoles.includes(role)) {
      throw new Error('Papel inválido');
    }
    
    const sql = 'UPDATE Atendente SET tipo_usuario = ? WHERE cod_atendente = ?';
    await query(sql, [role, id]);
    return { success: true };
  }
}

module.exports = UserRepository;
