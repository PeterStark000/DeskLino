const { query } = require('../database');

/**
 * Repository para gerenciar Atendimentos (logs)
 */
class AttendanceRepository {
  /**
   * Lista últimos atendimentos (logs)
   */
  static async findRecent(limit = 50) {
    // Observação: antes havia duplicação de linhas quando o cliente tinha vários telefones,
    // o que dava a impressão de ordenação incorreta. Agrupamos e pegamos MIN(numero) como telefone principal.
    const sql = `
      SELECT 
        a.cod_atendimento AS id,
        a.data_hora AS datetime,
        at.nome AS user,
        'ATENDIMENTO' AS type,
        c.nome AS detail,
        MIN(t.numero) AS phone
      FROM Atendimento a
      INNER JOIN Atendente at ON a.cod_atendente = at.cod_atendente
      INNER JOIN Cliente c ON a.cod_cliente = c.cod_cliente
      LEFT JOIN Telefone t ON c.cod_cliente = t.cod_cliente
      GROUP BY a.cod_atendimento, a.data_hora, at.nome, c.nome
      ORDER BY a.data_hora DESC, a.cod_atendimento DESC
      LIMIT ?
    `;
    return await query(sql, [limit]);
  }

  /**
   * Cria registro de atendimento (log)
   */
  static async create(logData) {
    const { user, detail, cod_cliente } = logData;

    // Busca atendente
    const [atendente] = await query(
      'SELECT cod_atendente FROM Atendente WHERE nome = ? OR login = ? LIMIT 1',
      [user, user]
    );

    if (!atendente) {
      console.warn('Atendente não encontrado para log:', user);
      return { success: false };
    }

    // Gera próximo ID
    const [maxAtend] = await query('SELECT COALESCE(MAX(cod_atendimento), 0) + 1 as next_id FROM Atendimento');

    const sql = 'INSERT INTO Atendimento (cod_atendimento, cod_cliente, cod_atendente) VALUES (?, ?, ?)';
    await query(sql, [maxAtend[0].next_id, cod_cliente || 1, atendente.cod_atendente]);

    return { success: true, insertId: maxAtend[0].next_id };
  }
}

module.exports = AttendanceRepository;
