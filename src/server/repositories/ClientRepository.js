const { query, withTransaction, txQuery, txExecute } = require('../database');

/**
 * Repository para gerenciar Clientes e dados relacionados (PF/PJ)
 */
class ClientRepository {
  /**
   * Busca cliente por número de telefone
   */
  static async findByPhone(phone) {
    const sql = `
      SELECT 
        c.cod_cliente as id,
        c.nome as name,
        c.email,
        c.tipo_cliente,
        c.observacoes as notes,
        t.numero as phone,
        e.logradouro as address,
        e.numero as number,
        e.complemento,
        e.bairro,
        e.ponto_ref as ref,
        pf.cpf,
        pj.cnpj
      FROM Cliente c
      INNER JOIN Telefone t ON c.cod_cliente = t.cod_cliente
      LEFT JOIN Endereco_Entrega e ON c.cod_cliente = e.cod_cliente AND e.principal = 'S'
      LEFT JOIN Pessoa_Fisica pf ON c.cod_cliente = pf.cod_cliente
      LEFT JOIN Pessoa_Juridica pj ON c.cod_cliente = pj.cod_cliente
      WHERE t.numero = ?
      LIMIT 1
    `;
    const rows = await query(sql, [phone]);
    return rows[0] || null;
  }

  /**
   * Busca cliente por ID
   */
  static async findById(id) {
    const sql = `
      SELECT 
        c.cod_cliente as id,
        c.nome as name,
        c.email,
        c.tipo_cliente,
        c.observacoes as notes,
        (SELECT t.numero FROM Telefone t WHERE t.cod_cliente = c.cod_cliente LIMIT 1) as phone,
        pf.cpf, 
        pj.cnpj,
        e.logradouro as address, 
        e.numero as number, 
        e.complemento, 
        e.bairro, 
        e.ponto_ref as ref
      FROM Cliente c
      LEFT JOIN Pessoa_Fisica pf ON pf.cod_cliente = c.cod_cliente
      LEFT JOIN Pessoa_Juridica pj ON pj.cod_cliente = c.cod_cliente
      LEFT JOIN Endereco_Entrega e ON e.cod_cliente = c.cod_cliente AND e.principal = 'S'
      WHERE c.cod_cliente = ?
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  }

  /**
   * Busca clientes por nome ou email
   */
  static async search(searchTerm) {
    const term = `%${searchTerm}%`;
    const sql = `
      SELECT 
        c.cod_cliente as id,
        c.nome as name,
        c.email,
        c.tipo_cliente,
        c.observacoes as notes,
        (SELECT t.numero FROM Telefone t WHERE t.cod_cliente = c.cod_cliente ORDER BY t.cod_telefone LIMIT 1) as phone,
        (SELECT GROUP_CONCAT(t.numero ORDER BY t.cod_telefone SEPARATOR ', ') FROM Telefone t WHERE t.cod_cliente = c.cod_cliente) as phones,
        e.logradouro as address,
        e.numero as number,
        e.complemento,
        e.bairro,
        e.ponto_ref as ref,
        pf.cpf,
        pj.cnpj
      FROM Cliente c
      LEFT JOIN Endereco_Entrega e ON c.cod_cliente = e.cod_cliente AND e.principal = 'S'
      LEFT JOIN Pessoa_Fisica pf ON c.cod_cliente = pf.cod_cliente
      LEFT JOIN Pessoa_Juridica pj ON c.cod_cliente = pj.cod_cliente
      WHERE c.nome LIKE ? OR c.email LIKE ?
      ORDER BY c.nome ASC
      LIMIT 10
    `;
    return await query(sql, [term, term]);
  }

  /**
   * Lista clientes com paginação
   */
  static async list({ page = 1, pageSize = 20, search = '' }) {
    const offset = (page - 1) * pageSize;
    const term = `%${search}%`;
    const where = search ? 'WHERE c.nome LIKE ? OR c.email LIKE ?' : '';
    const params = search ? [term, term, pageSize, offset] : [pageSize, offset];

    const sql = `
      SELECT 
        c.cod_cliente as id,
        c.nome as name,
        c.email,
        c.tipo_cliente,
        c.observacoes as notes,
        pf.cpf, 
        pj.cnpj,
        (SELECT t.numero FROM Telefone t WHERE t.cod_cliente = c.cod_cliente LIMIT 1) as phone
      FROM Cliente c
      LEFT JOIN Pessoa_Fisica pf ON pf.cod_cliente = c.cod_cliente
      LEFT JOIN Pessoa_Juridica pj ON pj.cod_cliente = c.cod_cliente
      ${where}
      ORDER BY c.cod_cliente DESC
      LIMIT ? OFFSET ?
    `;
    const rows = await query(sql, params);

    const countSql = `SELECT COUNT(*) as total FROM Cliente c ${where}`;
    const countParams = search ? [term, term] : [];
    const totalRows = await query(countSql, countParams);
    const total = totalRows[0]?.total || 0;

    return { page, pageSize, total, rows };
  }

  /**
   * Cria novo cliente com telefone e opcionalmente endereço
   */
  static async create(clientData) {
    const { phone, name, email, address, number, complemento, bairro, ref, notes, tipo_cliente = 'PF', documento } = clientData;

    return withTransaction(async (connection) => {
      // 1. Próximo ID do cliente
      const [maxClient] = await txQuery(connection, 'SELECT COALESCE(MAX(cod_cliente), 0) + 1 as next_id FROM Cliente');
      const cod_cliente = maxClient[0].next_id;

      // 2. Insere Cliente
      await txExecute(connection,
        'INSERT INTO Cliente (cod_cliente, nome, email, tipo_cliente, observacoes) VALUES (?, ?, ?, ?, ?)',
        [cod_cliente, name, email || `cliente${cod_cliente}@desklino.com`, tipo_cliente, notes || null]
      );

      // 3. Insere Telefone
      const [maxTel] = await txQuery(connection, 'SELECT COALESCE(MAX(cod_telefone), 0) + 1 as next_id FROM Telefone');
      await txExecute(connection,
        'INSERT INTO Telefone (cod_telefone, cod_cliente, numero) VALUES (?, ?, ?)',
        [maxTel[0].next_id, cod_cliente, phone]
      );

      // 4. Insere Endereço (se fornecido)
      if (address && bairro) {
        await txExecute(connection,
          'INSERT INTO Endereco_Entrega (nome_end, logradouro, numero, complemento, bairro, ponto_ref, cod_cliente, principal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          ['Principal', address, number || 'S/N', complemento || null, bairro, ref || null, cod_cliente, 'S']
        );
      }

      // 5. Insere CPF ou CNPJ
      if (documento) {
        if (tipo_cliente === 'PF') {
          await txExecute(connection, 'INSERT INTO Pessoa_Fisica (cod_cliente, cpf) VALUES (?, ?)', [cod_cliente, documento]);
        } else if (tipo_cliente === 'PJ') {
          await txExecute(connection, 'INSERT INTO Pessoa_Juridica (cod_cliente, cnpj) VALUES (?, ?)', [cod_cliente, documento]);
        }
      }

      return { insertId: cod_cliente };
    });
  }

  /**
   * Atualiza dados do cliente
   */
  static async update(id, { name, email, tipo_cliente, documento, notes }) {
    return withTransaction(async (connection) => {
      // Atualiza campos básicos
      const fields = [];
      const values = [];
      if (name) { fields.push('nome = ?'); values.push(name); }
      if (email) { fields.push('email = ?'); values.push(email); }
      if (tipo_cliente) { fields.push('tipo_cliente = ?'); values.push(tipo_cliente); }
      if (notes !== undefined) { fields.push('observacoes = ?'); values.push(notes); }

      if (fields.length) {
        await txExecute(connection, `UPDATE Cliente SET ${fields.join(', ')} WHERE cod_cliente = ?`, [...values, id]);
      }

      // Atualiza documento
      if (documento && tipo_cliente) {
        if (tipo_cliente === 'PF') {
          await txExecute(connection, 'DELETE FROM Pessoa_Juridica WHERE cod_cliente = ?', [id]);
          const [pf] = await txQuery(connection, 'SELECT 1 FROM Pessoa_Fisica WHERE cod_cliente = ? LIMIT 1', [id]);
          if (pf[0].length) {
            await txExecute(connection, 'UPDATE Pessoa_Fisica SET cpf = ? WHERE cod_cliente = ?', [documento, id]);
          } else {
            await txExecute(connection, 'INSERT INTO Pessoa_Fisica (cod_cliente, cpf) VALUES (?, ?)', [id, documento]);
          }
        } else if (tipo_cliente === 'PJ') {
          await txExecute(connection, 'DELETE FROM Pessoa_Fisica WHERE cod_cliente = ?', [id]);
          const [pj] = await txQuery(connection, 'SELECT 1 FROM Pessoa_Juridica WHERE cod_cliente = ? LIMIT 1', [id]);
          if (pj[0].length) {
            await txExecute(connection, 'UPDATE Pessoa_Juridica SET cnpj = ? WHERE cod_cliente = ?', [documento, id]);
          } else {
            await txExecute(connection, 'INSERT INTO Pessoa_Juridica (cod_cliente, cnpj) VALUES (?, ?)', [id, documento]);
          }
        }
      }

      return { success: true };
    });
  }

  /**
   * Remove cliente (apenas se não tiver pedidos)
   */
  static async delete(id) {
    return withTransaction(async (connection) => {
      // Verifica se tem pedidos
      const [cnt] = await txQuery(connection, `
        SELECT COUNT(*) as total
        FROM Atendimento a
        INNER JOIN Pedido p ON p.cod_atendimento = a.cod_atendimento
        WHERE a.cod_cliente = ?
      `, [id]);

      if (cnt[0].total > 0) {
        throw new Error('Não é possível apagar: cliente possui pedidos');
      }

      // Remove dependências
      await txExecute(connection, 'DELETE FROM Pessoa_Fisica WHERE cod_cliente = ?', [id]);
      await txExecute(connection, 'DELETE FROM Pessoa_Juridica WHERE cod_cliente = ?', [id]);
      await txExecute(connection, 'DELETE FROM Endereco_Entrega WHERE cod_cliente = ?', [id]);
      await txExecute(connection, 'DELETE FROM Telefone WHERE cod_cliente = ?', [id]);
      await txExecute(connection, 'DELETE FROM Atendimento WHERE cod_cliente = ?', [id]);
      await txExecute(connection, 'DELETE FROM Cliente WHERE cod_cliente = ?', [id]);

      return { success: true };
    });
  }
}

module.exports = ClientRepository;
