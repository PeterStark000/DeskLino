const mysql = require('mysql2/promise');

/**
 * Configuração da conexão MySQL
 * IMPORTANTE: Configure as variáveis de ambiente ou substitua pelos valores reais
 */
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'desklino',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Pool de conexões (recomendado para produção)
const pool = mysql.createPool(dbConfig);

/**
 * Testa a conexão com o banco de dados
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✓ Conectado ao MySQL com sucesso!');
    connection.release();
    return true;
  } catch (error) {
    console.error('✗ Erro ao conectar ao MySQL:', error.message);
    return false;
  }
}

/**
 * Executa uma query genérica
 * @param {string} sql - Query SQL
 * @param {Array} params - Parâmetros para prepared statement
 * @returns {Promise<Array>} Resultados da query
 */
async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Erro na query:', error.message);
    throw error;
  }
}

// =============================================================================
// FUNÇÕES DE ACESSO AO BANCO (IMPLEMENTAR CONFORME SCHEMA)
// =============================================================================

/**
 * Busca usuário por login (username)
 * Tabela: Atendente (cod_atendente, nome, login, senha, tipo_usuario)
 */
async function getUserByUsername(username) {
  const sql = 'SELECT cod_atendente as id, login as username, nome as name, senha as password_hash, tipo_usuario as role FROM Atendente WHERE login = ? LIMIT 1';
  const rows = await query(sql, [username]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Lista todos os usuários (atendentes)
 */
async function getAllUsers() {
  const sql = 'SELECT cod_atendente as id, login as username, nome as name, tipo_usuario as role FROM Atendente ORDER BY nome';
  return await query(sql);
}

/**
 * Busca cliente por número de telefone
 * Tabelas: Cliente, Telefone, Endereco_Entrega
 */
async function getClientByPhone(phone) {
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
      e.ponto_ref as ref
    FROM Cliente c
    INNER JOIN Telefone t ON c.cod_cliente = t.cod_cliente
    LEFT JOIN Endereco_Entrega e ON c.cod_cliente = e.cod_cliente AND e.principal = 'S'
    WHERE t.numero = ?
    LIMIT 1
  `;
  const rows = await query(sql, [phone]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Cria novo cliente com telefone e endereço
 * Tabelas: Cliente, Telefone, Endereco_Entrega
 */
async function createClient(clientData) {
  const { phone, name, email, address, number, complemento, bairro, ref, notes, tipo_cliente = 'PF' } = clientData;
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // 1. Busca próximo cod_cliente
    const [maxClient] = await connection.query('SELECT COALESCE(MAX(cod_cliente), 0) + 1 as next_id FROM Cliente');
    const cod_cliente = maxClient[0].next_id;
    
    // 2. Insere Cliente
    await connection.execute(
      'INSERT INTO Cliente (cod_cliente, nome, email, tipo_cliente, observacoes) VALUES (?, ?, ?, ?, ?)',
      [cod_cliente, name, email || `cliente${cod_cliente}@desklino.com`, tipo_cliente, notes || null]
    );
    
    // 3. Busca próximo cod_telefone e insere Telefone
    const [maxTel] = await connection.query('SELECT COALESCE(MAX(cod_telefone), 0) + 1 as next_id FROM Telefone');
    await connection.execute(
      'INSERT INTO Telefone (cod_telefone, cod_cliente, numero) VALUES (?, ?, ?)',
      [maxTel[0].next_id, cod_cliente, phone]
    );
    
    // 4. Insere Endereco_Entrega (se fornecido)
    if (address && bairro) {
      await connection.execute(
        'INSERT INTO Endereco_Entrega (nome_end, logradouro, numero, complemento, bairro, ponto_ref, cod_cliente, principal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        ['Principal', address, number || 'S/N', complemento || null, bairro, ref || null, cod_cliente, 'S']
      );
    }
    
    await connection.commit();
    return { insertId: cod_cliente };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Busca histórico de pedidos de um cliente
 * Tabelas: Pedido, Atendimento, Item_Pedido, Produto
 */
async function getClientOrderHistory(clientId) {
  const sql = `
    SELECT 
      p.cod_pedido as id,
      p.data_pedido as created_at,
      p.status,
      p.forma_pag as payment_method,
      p.observacao as notes,
      GROUP_CONCAT(CONCAT(pr.nome, ' (', ip.quantidade, 'x)') SEPARATOR ', ') as products
    FROM Pedido p
    INNER JOIN Atendimento at ON p.cod_atendimento = at.cod_atendimento
    LEFT JOIN Item_Pedido ip ON p.cod_pedido = ip.cod_pedido
    LEFT JOIN Produto pr ON ip.cod_produto = pr.cod_produto
    WHERE at.cod_cliente = ?
    GROUP BY p.cod_pedido
    ORDER BY p.data_pedido DESC
    LIMIT 10
  `;
  return await query(sql, [clientId]);
}

/**
 * Cria novo pedido com múltiplos itens
 * orderData: { client_id, items: [{ product: 'Nome', quantity: 2 }], notes, user }
 */
async function createOrder(orderData) {
  const { client_id, items, notes, status = 'Pendente', forma_pag = 'Dinheiro' } = orderData;
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // 1. Cria Atendimento
    const [maxAtend] = await connection.query('SELECT COALESCE(MAX(cod_atendimento), 0) + 1 as next_id FROM Atendimento');
    const cod_atendimento = maxAtend[0].next_id;
    
    // Busca primeiro atendente disponível (simplificado)
    const [atendente] = await connection.query('SELECT cod_atendente FROM Atendente LIMIT 1');
    
    await connection.execute(
      'INSERT INTO Atendimento (cod_atendimento, cod_cliente, cod_atendente) VALUES (?, ?, ?)',
      [cod_atendimento, client_id, atendente[0].cod_atendente]
    );
    
    // 2. Busca endereço principal do cliente
    const [endereco] = await connection.query(
      'SELECT cod_endereco FROM Endereco_Entrega WHERE cod_cliente = ? AND principal = "S" LIMIT 1',
      [client_id]
    );
    
    if (!endereco[0]) throw new Error('Cliente sem endereço cadastrado');
    
    // 3. Cria Pedido
    const [maxPed] = await connection.query('SELECT COALESCE(MAX(cod_pedido), 0) + 1 as next_id FROM Pedido');
    const cod_pedido = maxPed[0].next_id;
    
    await connection.execute(
      'INSERT INTO Pedido (cod_pedido, status, forma_pag, observacao, cod_atendimento, cod_endereco) VALUES (?, ?, ?, ?, ?, ?)',
      [cod_pedido, status, forma_pag, notes || null, cod_atendimento, endereco[0].cod_endereco]
    );
    
    // 4. Insere Item_Pedido para cada produto
    for (const item of items) {
      // Busca cod_produto pelo nome
      const [produto] = await connection.query('SELECT cod_produto FROM Produto WHERE nome LIKE ? LIMIT 1', [`%${item.product}%`]);
      
      if (produto[0]) {
        await connection.execute(
          'INSERT INTO Item_Pedido (cod_pedido, cod_produto, quantidade) VALUES (?, ?, ?)',
          [cod_pedido, produto[0].cod_produto, item.quantity]
        );
      }
    }
    
    await connection.commit();
    return cod_pedido;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Lista logs de atendimento (últimos 50)
 * Tabela: Atendimento com telefone do cliente
 */
async function getAllLogs() {
  const sql = `
    SELECT 
      a.cod_atendimento as id,
      a.data_hora as datetime,
      at.nome as user,
      'ATENDIMENTO' as type,
      c.nome as detail,
      t.numero as phone
    FROM Atendimento a
    INNER JOIN Atendente at ON a.cod_atendente = at.cod_atendente
    INNER JOIN Cliente c ON a.cod_cliente = c.cod_cliente
    LEFT JOIN Telefone t ON c.cod_cliente = t.cod_cliente
    ORDER BY a.data_hora DESC
    LIMIT 50
  `;
  return await query(sql);
}

/**
 * Cria registro de atendimento (log)
 */
async function createLog(logData) {
  const { user, detail, cod_cliente } = logData;
  
  // Busca cod_atendente pelo nome do usuário
  const [atendente] = await query('SELECT cod_atendente FROM Atendente WHERE nome = ? OR login = ? LIMIT 1', [user, user]);
  if (!atendente) {
    console.warn('Atendente não encontrado para log:', user);
    return { success: false };
  }
  
  // Gera próximo cod_atendimento
  const [maxAtend] = await query('SELECT COALESCE(MAX(cod_atendimento), 0) + 1 as next_id FROM Atendimento');
  
  const sql = 'INSERT INTO Atendimento (cod_atendimento, cod_cliente, cod_atendente) VALUES (?, ?, ?)';
  await query(sql, [maxAtend[0].next_id, cod_cliente || 1, atendente.cod_atendente]);
  return { success: true, insertId: maxAtend[0].next_id };
}

/**
 * Busca todos os produtos disponíveis
 * Tabela: Produto (cod_produto, nome, descricao, valor)
 */
async function getAllProducts() {
  const sql = 'SELECT cod_produto as id, nome as name, descricao as description, valor as price FROM Produto ORDER BY nome';
  return await query(sql);
}

// Exporta pool e funções
module.exports = {
  pool,
  testConnection,
  query,
  // Usuários
  getUserByUsername,
  getAllUsers,
  // Clientes
  getClientByPhone,
  createClient,
  // Pedidos
  getClientOrderHistory,
  createOrder,
  // Logs
  getAllLogs,
  createLog,
  // Produtos
  getAllProducts
};
