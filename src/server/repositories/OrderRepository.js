const { query, withTransaction, txQuery, txExecute } = require('../database');

/**
 * Repository para gerenciar Pedidos e Itens de Pedido
 */
class OrderRepository {
  /**
   * Busca histórico de pedidos de um cliente
   */
  static async findByClient(clientId) {
    const sql = `
      SELECT 
        v.*,
        (
          SELECT GROUP_CONCAT(CONCAT(i.product, ' (', i.quantity, 'x)') SEPARATOR ', ')
          FROM vw_itens_pedido i
          WHERE i.cod_pedido = v.id
        ) as products
      FROM vw_pedido_resumo v
      WHERE v.client_id = ?
      ORDER BY v.created_at DESC
      LIMIT 10
    `;
    return await query(sql, [clientId]);
  }

  /**
   * Busca pedido por atendimento
   */
  static async findByAtendimento(atendimentoId) {
    const orderSql = `
      SELECT *
      FROM vw_pedido_resumo
      WHERE atendimento_id = ?
      LIMIT 1
    `;
    const orders = await query(orderSql, [atendimentoId]);
    if (!orders.length) return null;

    const order = orders[0];
    order.items = await this._getOrderItems(order.id);
    return order;
  }

  /**
   * Busca detalhes completos do pedido
   */
  static async findById(orderId) {
    const orderSql = `
      SELECT *
      FROM vw_pedido_resumo
      WHERE id = ?
      LIMIT 1
    `;
    const orders = await query(orderSql, [orderId]);
    if (!orders.length) return null;

    const order = orders[0];
    order.items = await this._getOrderItems(order.id);
    return order;
  }

  /**
   * Lista pedidos (admin) com filtros e paginação
   */
  static async list({ page = 1, pageSize = 20, search = '', clientId = null, status = '' }) {
    const offset = (page - 1) * pageSize;
    const filters = [];
    const params = [];

    if (clientId) {
      filters.push('v.client_id = ?');
      params.push(clientId);
    }
    if (status) {
      filters.push('v.status = ?');
      params.push(status);
    }
    if (search) {
      filters.push('(v.client_name LIKE ? OR EXISTS (SELECT 1 FROM Telefone t WHERE t.cod_cliente = v.client_id AND t.numero LIKE ?))');
      const term = `%${search}%`;
      params.push(term, term);
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const sql = `
      SELECT
        v.*,
        (SELECT t.numero FROM Telefone t WHERE t.cod_cliente = v.client_id ORDER BY t.cod_telefone LIMIT 1) as phone
      FROM vw_pedido_resumo v
      ${where}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;
    const rows = await query(sql, [...params, pageSize, offset]);

    const countSql = `
      SELECT COUNT(*) as total
      FROM vw_pedido_resumo v
      ${where}
    `;
    const totalRows = await query(countSql, params);
    const total = totalRows[0]?.total || 0;

    return { page, pageSize, total, rows };
  }

  /**
   * Cria novo pedido com itens
   */
  static async create(orderData) {
    const { client_id, items, notes, forma_pag = 'Dinheiro', status = 'Pendente', address_id = null, valor_total = 0 } = orderData;

    return withTransaction(async (connection) => {
      // 1. Cria Atendimento
      const [maxAtend] = await txQuery(connection, 'SELECT COALESCE(MAX(cod_atendimento), 0) + 1 as next_id FROM Atendimento');
      const cod_atendimento = maxAtend[0].next_id;

      const [atendente] = await txQuery(connection, 'SELECT cod_atendente FROM Atendente LIMIT 1');

      await txExecute(connection,
        'INSERT INTO Atendimento (cod_atendimento, cod_cliente, cod_atendente) VALUES (?, ?, ?)',
        [cod_atendimento, client_id, atendente[0].cod_atendente]
      );

      // 2. Define endereço
      let cod_endereco = address_id;
      if (!cod_endereco) {
        const [endereco] = await txQuery(connection,
          'SELECT cod_endereco FROM Endereco_Entrega WHERE cod_cliente = ? AND principal = "S" LIMIT 1',
          [client_id]
        );
        if (!endereco[0]) throw new Error('Cliente sem endereço cadastrado');
        cod_endereco = endereco[0].cod_endereco;
      }

      // 3. Resolve produtos e calcula total
      let computedTotal = 0;
      const resolvedItems = [];

      for (const item of items) {
        const [produto] = await txQuery(connection,
          'SELECT cod_produto, valor FROM Produto WHERE nome LIKE ? LIMIT 1',
          [`%${item.product}%`]
        );

        if (produto && produto[0]) {
          const price = Number(produto[0].valor || 0);
          const qty = Number(item.quantity || 0);
          computedTotal += price * qty;
          resolvedItems.push({ cod_produto: produto[0].cod_produto, quantity: qty });
        }
      }

      const finalTotal = Number(valor_total) > 0 ? Number(valor_total) : computedTotal;

      // 4. Cria Pedido
      const [maxPed] = await txQuery(connection, 'SELECT COALESCE(MAX(cod_pedido), 0) + 1 as next_id FROM Pedido');
      const cod_pedido = maxPed[0].next_id;

      await txExecute(connection,
        'INSERT INTO Pedido (cod_pedido, status, forma_pag, valor_total, observacao, cod_atendimento, cod_endereco) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [cod_pedido, status, forma_pag, finalTotal, notes || null, cod_atendimento, cod_endereco]
      );

      // 5. Insere itens e baixa estoque
      for (const it of resolvedItems) {
        await txExecute(connection,
          'INSERT INTO Item_Pedido (cod_pedido, cod_produto, quantidade) VALUES (?, ?, ?)',
          [cod_pedido, it.cod_produto, it.quantity]
        );
      }

      return cod_pedido;
    });
  }

  /**
   * Atualiza status do pedido
   */
  static async updateStatus(orderId, status) {
    const sql = 'UPDATE Pedido SET status = ? WHERE cod_pedido = ?';
    await query(sql, [status, orderId]);
    return { success: true };
  }

  /**
   * Recalcula e corrige o valor total do pedido
   */
  static async recalculateTotal(orderId) {
    const totalRows = await query(
      `SELECT COALESCE(SUM(subtotal), 0) as total
       FROM vw_itens_pedido
       WHERE cod_pedido = ?`,
      [orderId]
    );

    const total = Number(totalRows[0]?.total || 0);
    await query('UPDATE Pedido SET valor_total = ? WHERE cod_pedido = ?', [total, orderId]);

    return { valor_total: total };
  }

  /**
   * Helper: busca itens de um pedido
   */
  static async _getOrderItems(orderId) {
    const sql = `
      SELECT 
        product, 
        quantity, 
        unit_price as price,
        subtotal
      FROM vw_itens_pedido
      WHERE cod_pedido = ?
    `;
    return await query(sql, [orderId]);
  }
}

module.exports = OrderRepository;
