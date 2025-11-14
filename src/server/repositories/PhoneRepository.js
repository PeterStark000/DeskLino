const { query, withTransaction, txQuery, txExecute } = require('../database');

/**
 * Repository para gerenciar Telefones
 */
class PhoneRepository {
  /**
   * Lista telefones de um cliente
   */
  static async findByClient(clientId) {
    const sql = `
      SELECT cod_telefone as id, numero 
      FROM Telefone 
      WHERE cod_cliente = ? 
      ORDER BY cod_telefone
    `;
    return await query(sql, [clientId]);
  }

  /**
   * Lista todos os telefones (admin) com paginação
   */
  static async list({ page = 1, pageSize = 20, search = '' }) {
    const offset = (page - 1) * pageSize;
    const term = `%${search}%`;
    const where = search ? 'WHERE t.numero LIKE ? OR c.nome LIKE ?' : '';
    const params = search ? [term, term, pageSize, offset] : [pageSize, offset];

    const sql = `
      SELECT 
        t.cod_telefone as id, 
        t.numero, 
        c.cod_cliente as client_id, 
        c.nome as client_name
      FROM Telefone t
      INNER JOIN Cliente c ON c.cod_cliente = t.cod_cliente
      ${where}
      ORDER BY t.cod_telefone DESC
      LIMIT ? OFFSET ?
    `;
    const rows = await query(sql, params);

    const countSql = `
      SELECT COUNT(*) as total
      FROM Telefone t 
      INNER JOIN Cliente c ON c.cod_cliente = t.cod_cliente
      ${where}
    `;
    const countParams = search ? [term, term] : [];
    const totalRows = await query(countSql, countParams);
    const total = totalRows[0]?.total || 0;

    return { page, pageSize, total, rows };
  }

  /**
   * Adiciona telefone a um cliente
   */
  static async create(clientId, numero) {
    return withTransaction(async (connection) => {
      const [maxTel] = await txQuery(connection, 'SELECT COALESCE(MAX(cod_telefone), 0) + 1 as next_id FROM Telefone');
      await txExecute(connection, 
        'INSERT INTO Telefone (cod_telefone, cod_cliente, numero) VALUES (?, ?, ?)', 
        [maxTel[0].next_id, clientId, numero]
      );
      return { telefoneId: maxTel[0].next_id };
    });
  }

  /**
   * Atualiza número de telefone
   */
  static async update(id, numero) {
    const sql = 'UPDATE Telefone SET numero = ? WHERE cod_telefone = ?';
    await query(sql, [numero, id]);
    return { success: true };
  }

  /**
   * Remove telefone
   */
  static async delete(id) {
    const sql = 'DELETE FROM Telefone WHERE cod_telefone = ?';
    await query(sql, [id]);
    return { success: true };
  }
}

module.exports = PhoneRepository;
