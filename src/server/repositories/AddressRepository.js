const { query, withTransaction, txQuery, txExecute } = require('../database');

/**
 * Repository para gerenciar Endereços de Entrega
 */
class AddressRepository {
  /**
   * Lista endereços de um cliente
   */
  static async findByClient(clientId) {
    const sql = `
      SELECT 
        cod_endereco as id, 
        nome_end, 
        logradouro, 
        numero, 
        complemento, 
        bairro, 
        ponto_ref, 
        principal
      FROM Endereco_Entrega 
      WHERE cod_cliente = ? 
      ORDER BY principal DESC, cod_endereco
    `;
    return await query(sql, [clientId]);
  }

  /**
   * Adiciona novo endereço
   */
  static async create(clientId, addressData) {
    const { nome_end, logradouro, numero, complemento, bairro, ponto_ref, principal = 'N' } = addressData;

    return withTransaction(async (connection) => {
      // Se for principal, desmarca os outros
      if (principal === 'S') {
        await txExecute(connection, 'UPDATE Endereco_Entrega SET principal = "N" WHERE cod_cliente = ?', [clientId]);
      }

      await txExecute(connection,
        'INSERT INTO Endereco_Entrega (nome_end, logradouro, numero, complemento, bairro, ponto_ref, cod_cliente, principal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [nome_end, logradouro, numero, complemento || null, bairro, ponto_ref || null, clientId, principal]
      );

      return { success: true };
    });
  }

  /**
   * Atualiza endereço
   */
  static async update(clientId, enderecoId, addressData) {
    const { nome_end, logradouro, numero, complemento, bairro, ponto_ref, principal } = addressData;

    return withTransaction(async (connection) => {
      // Se marcar como principal, desmarca os outros
      if (principal === 'S') {
        await txExecute(connection, 
          'UPDATE Endereco_Entrega SET principal = "N" WHERE cod_cliente = ? AND cod_endereco != ?', 
          [clientId, enderecoId]
        );
      }

      await txExecute(connection,
        'UPDATE Endereco_Entrega SET nome_end = ?, logradouro = ?, numero = ?, complemento = ?, bairro = ?, ponto_ref = ?, principal = ? WHERE cod_endereco = ? AND cod_cliente = ?',
        [nome_end, logradouro, numero, complemento || null, bairro, ponto_ref || null, principal, enderecoId, clientId]
      );

      return { success: true };
    });
  }

  /**
   * Define endereço como principal
   */
  static async setPrimary(clientId, enderecoId) {
    return withTransaction(async (connection) => {
      await txExecute(connection, 'UPDATE Endereco_Entrega SET principal = "N" WHERE cod_cliente = ?', [clientId]);
      await txExecute(connection, 
        'UPDATE Endereco_Entrega SET principal = "S" WHERE cod_endereco = ? AND cod_cliente = ?', 
        [enderecoId, clientId]
      );
      return { success: true };
    });
  }

  /**
   * Remove endereço
   */
  static async delete(clientId, enderecoId) {
    return withTransaction(async (connection) => {
      // Verifica quantidade de endereços
      const [result] = await txQuery(connection, 
        'SELECT COUNT(*) as total FROM Endereco_Entrega WHERE cod_cliente = ?', 
        [clientId]
      );

      if (result[0].total <= 1) {
        throw new Error('Cliente deve ter pelo menos um endereço');
      }

      // Verifica se está vinculado a pedidos
      const [pedidos] = await txQuery(connection, 
        'SELECT COUNT(*) as total FROM Pedido WHERE cod_endereco = ?', 
        [enderecoId]
      );

      if (pedidos[0].total > 0) {
        throw new Error('Não é possível excluir endereço vinculado a pedidos existentes');
      }

      // Verifica se é principal
      const [addr] = await txQuery(connection, 
        'SELECT principal FROM Endereco_Entrega WHERE cod_endereco = ? AND cod_cliente = ?', 
        [enderecoId, clientId]
      );
      const wasPrimary = addr[0]?.principal === 'S';

      // Remove endereço
      await txExecute(connection, 
        'DELETE FROM Endereco_Entrega WHERE cod_endereco = ? AND cod_cliente = ?', 
        [enderecoId, clientId]
      );

      // Se era principal, define outro como principal
      if (wasPrimary) {
        await txExecute(connection, 
          'UPDATE Endereco_Entrega SET principal = "S" WHERE cod_cliente = ? LIMIT 1', 
          [clientId]
        );
      }

      return { success: true };
    });
  }
}

module.exports = AddressRepository;
