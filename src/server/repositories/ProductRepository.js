const { query } = require('../database');

/**
 * Repository para gerenciar Produtos
 */
class ProductRepository {
  /**
   * Lista produtos disponíveis para atendimento (disponível e em estoque, não vencidos)
   */
  static async findAvailable() {
    const sql = `
      SELECT 
        cod_produto as id, 
        nome as name, 
        descricao as description, 
        valor as price, 
        qtde_estoque as stock,
        data_validade as expiry_date
      FROM Produto 
      WHERE disponivel = "S" AND qtde_estoque > 0 
        AND (data_validade IS NULL OR data_validade >= CURDATE())
      ORDER BY nome
    `;
    return await query(sql);
  }

  /**
   * Lista todos os produtos (admin)
   */
  static async findAll() {
    const sql = `
      SELECT 
        cod_produto as id, 
        nome as name, 
        descricao as description, 
        valor as price, 
        qtde_estoque as stock, 
        disponivel as available,
        data_validade as expiry_date
      FROM Produto 
      ORDER BY nome
    `;
    return await query(sql);
  }

  /**
   * Cria novo produto
   */
  static async create(productData) {
    const { nome, descricao, valor } = productData;
    const qtde_estoque = productData.qtde_estoque ?? productData.quantidade_estoque ?? 0;
    const data_validade = productData.data_validade || null;

    // Se a data de validade já estiver vencida, forçar indisponível
    let disponivel = productData.disponivel ?? 'S';
    if (data_validade && new Date(data_validade) < new Date(new Date().toDateString())) {
      disponivel = 'N';
    }

    const sql = `
      INSERT INTO Produto (cod_produto, nome, descricao, valor, qtde_estoque, disponivel, data_validade) 
      VALUES ((SELECT COALESCE(MAX(cod_produto), 0) + 1 FROM Produto p), ?, ?, ?, ?, ?, ?)
    `;
    return await query(sql, [nome, descricao || null, valor, qtde_estoque, disponivel, data_validade]);
  }

  /**
   * Atualiza produto — se a data de validade estiver vencida, força indisponível
   */
  static async update(productId, productData) {
    const { nome, descricao, valor } = productData;
    const qtde_estoque = productData.qtde_estoque ?? productData.quantidade_estoque ?? 0;
    const data_validade = productData.data_validade || null;

    // Se a data de validade já estiver vencida, forçar indisponível
    let disponivel = productData.disponivel ?? 'S';
    if (data_validade && new Date(data_validade) < new Date(new Date().toDateString())) {
      disponivel = 'N';
    }

    const sql = `
      UPDATE Produto 
      SET nome = ?, descricao = ?, valor = ?, qtde_estoque = ?, disponivel = ?, data_validade = ?
      WHERE cod_produto = ?
    `;
    return await query(sql, [nome, descricao || null, valor, qtde_estoque, disponivel, data_validade, productId]);
  }
}

module.exports = ProductRepository;
