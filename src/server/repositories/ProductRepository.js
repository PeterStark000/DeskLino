const { query } = require('../database');

/**
 * Repository para gerenciar Produtos
 */
class ProductRepository {
  /**
   * Lista produtos disponíveis para atendimento (disponível e em estoque)
   */
  static async findAvailable() {
    const sql = `
      SELECT 
        cod_produto as id, 
        nome as name, 
        descricao as description, 
        valor as price, 
        qtde_estoque as stock 
      FROM Produto 
      WHERE disponivel = "S" AND qtde_estoque > 0 
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
        disponivel as available 
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
    const disponivel = productData.disponivel ?? 'S';

    const sql = `
      INSERT INTO Produto (cod_produto, nome, descricao, valor, qtde_estoque, disponivel) 
      VALUES ((SELECT COALESCE(MAX(cod_produto), 0) + 1 FROM Produto p), ?, ?, ?, ?, ?)
    `;
    return await query(sql, [nome, descricao || null, valor, qtde_estoque, disponivel]);
  }

  /**
   * Atualiza produto
   */
  static async update(productId, productData) {
    const { nome, descricao, valor } = productData;
    const qtde_estoque = productData.qtde_estoque ?? productData.quantidade_estoque ?? 0;
    const disponivel = productData.disponivel ?? 'S';

    const sql = `
      UPDATE Produto 
      SET nome = ?, descricao = ?, valor = ?, qtde_estoque = ?, disponivel = ? 
      WHERE cod_produto = ?
    `;
    return await query(sql, [nome, descricao || null, valor, qtde_estoque, disponivel, productId]);
  }
}

module.exports = ProductRepository;
