const mysql = require('mysql2/promise');
const mysqlFormat = require('mysql2');

// Alternância global para logar SQL no console
const ENABLE_SQL_LOG = true;

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
    // Log da query formatada para o console (opcional)
    if (ENABLE_SQL_LOG) {
      try {
        const formatted = mysqlFormat.format(sql, params);
        console.log('[SQL]', formatted);
      } catch (_) {
        console.log('[SQL]', sql, params);
      }
    }
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Erro na query:', error.message);
    throw error;
  }
}

// Helpers para logar queries dentro de transações (connection.query/execute)
async function txQuery(connection, sql, params = []) {
  try {
    if (ENABLE_SQL_LOG) {
      const formatted = mysqlFormat.format(sql, params);
      console.log('[SQL]', formatted);
    }
  } catch (_) {
    if (ENABLE_SQL_LOG) console.log('[SQL]', sql, params);
  }
  return connection.query(sql, params);
}

async function txExecute(connection, sql, params = []) {
  try {
    if (ENABLE_SQL_LOG) {
      const formatted = mysqlFormat.format(sql, params);
      console.log('[SQL]', formatted);
    }
  } catch (_) {
    if (ENABLE_SQL_LOG) console.log('[SQL]', sql, params);
  }
  return connection.execute(sql, params);
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
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Busca clientes por nome ou email (para pesquisa)
 */
async function searchClients(searchTerm) {
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
    WHERE c.nome LIKE ? OR c.email LIKE ?
    LIMIT 10
  `;
  const term = `%${searchTerm}%`;
  return await query(sql, [term, term]);
}

// =========================
// Telefones (cliente)
// =========================
async function getClientPhones(clientId) {
  const sql = `SELECT cod_telefone as id, numero FROM Telefone WHERE cod_cliente = ? ORDER BY cod_telefone`;
  return await query(sql, [clientId]);
}

async function addPhone(clientId, numero) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [maxTel] = await txQuery(connection, 'SELECT COALESCE(MAX(cod_telefone), 0) + 1 as next_id FROM Telefone');
    await txExecute(connection, 'INSERT INTO Telefone (cod_telefone, cod_cliente, numero) VALUES (?, ?, ?)', [maxTel[0].next_id, clientId, numero]);
    await connection.commit();
    return { telefoneId: maxTel[0].next_id };
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}

// =========================
// Endereços (cliente)
// =========================
async function getClientAddresses(clientId) {
  const sql = `
    SELECT cod_endereco as id, nome_end, logradouro, numero, complemento, bairro, ponto_ref, principal
    FROM Endereco_Entrega WHERE cod_cliente = ? ORDER BY principal DESC, cod_endereco`;
  return await query(sql, [clientId]);
}

async function addAddress(clientId, address) {
  const { nome_end, logradouro, numero, complemento, bairro, ponto_ref, principal = 'N' } = address;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (principal === 'S') {
      await txExecute(connection, 'UPDATE Endereco_Entrega SET principal = "N" WHERE cod_cliente = ?', [clientId]);
    }
    await txExecute(connection, 'INSERT INTO Endereco_Entrega (nome_end, logradouro, numero, complemento, bairro, ponto_ref, cod_cliente, principal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
      nome_end, logradouro, numero, complemento || null, bairro, ponto_ref || null, clientId, principal
    ]);
    await connection.commit();
    return true;
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}

async function setPrimaryAddress(clientId, enderecoId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await txExecute(connection, 'UPDATE Endereco_Entrega SET principal = "N" WHERE cod_cliente = ?', [clientId]);
    await txExecute(connection, 'UPDATE Endereco_Entrega SET principal = "S" WHERE cod_endereco = ? AND cod_cliente = ?', [enderecoId, clientId]);
    await connection.commit();
    return true;
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}

async function deleteAddress(clientId, enderecoId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (ENABLE_SQL_LOG) console.log('[TX] BEGIN deleteAddress');
    
    // Verifica quantos endereços o cliente tem
    const [result] = await txQuery(connection, 'SELECT COUNT(*) as total FROM Endereco_Entrega WHERE cod_cliente = ?', [clientId]);
    if (result[0].total <= 1) {
      throw new Error('Cliente deve ter pelo menos um endereço');
    }
    
    // Verifica se o endereço a ser deletado é o principal
    const [addr] = await txQuery(connection, 'SELECT principal FROM Endereco_Entrega WHERE cod_endereco = ? AND cod_cliente = ?', [enderecoId, clientId]);
    const wasPrimary = addr[0]?.principal === 'S';
    
    // Apaga o endereço
    await txExecute(connection, 'DELETE FROM Endereco_Entrega WHERE cod_endereco = ? AND cod_cliente = ?', [enderecoId, clientId]);
    
    // Se era principal, define outro como principal
    if (wasPrimary) {
      await txExecute(connection, 'UPDATE Endereco_Entrega SET principal = "S" WHERE cod_cliente = ? LIMIT 1', [clientId]);
    }
    
    await connection.commit();
    if (ENABLE_SQL_LOG) console.log('[TX] COMMIT deleteAddress');
    return { success: true };
  } catch (error) {
    await connection.rollback();
    if (ENABLE_SQL_LOG) console.log('[TX] ROLLBACK deleteAddress');
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Cria novo cliente com telefone e endereço
 * Tabelas: Cliente, Telefone, Endereco_Entrega
 */
async function createClient(clientData) {
  const { phone, name, email, address, number, complemento, bairro, ref, notes, tipo_cliente = 'PF', documento } = clientData;
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (ENABLE_SQL_LOG) console.log('[TX] BEGIN createClient');
    
    // 1. Busca próximo cod_cliente
    const [maxClient] = await txQuery(connection, 'SELECT COALESCE(MAX(cod_cliente), 0) + 1 as next_id FROM Cliente');
    const cod_cliente = maxClient[0].next_id;
    if (ENABLE_SQL_LOG) console.log('[TX] -> next cod_cliente =', cod_cliente);
    
    // 2. Insere Cliente
    await txExecute(connection,
      'INSERT INTO Cliente (cod_cliente, nome, email, tipo_cliente, observacoes) VALUES (?, ?, ?, ?, ?)',
      [cod_cliente, name, email || `cliente${cod_cliente}@desklino.com`, tipo_cliente, notes || null]
    );
    
    // 3. Busca próximo cod_telefone e insere Telefone
    const [maxTel] = await txQuery(connection, 'SELECT COALESCE(MAX(cod_telefone), 0) + 1 as next_id FROM Telefone');
    if (ENABLE_SQL_LOG) console.log('[TX] -> next cod_telefone =', maxTel[0].next_id);
    await txExecute(connection,
      'INSERT INTO Telefone (cod_telefone, cod_cliente, numero) VALUES (?, ?, ?)',
      [maxTel[0].next_id, cod_cliente, phone]
    );
    
    // 4. Insere Endereco_Entrega
    if (address && bairro) {
      await txExecute(connection,
        'INSERT INTO Endereco_Entrega (nome_end, logradouro, numero, complemento, bairro, ponto_ref, cod_cliente, principal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        ['Principal', address, number || 'S/N', complemento || null, bairro, ref || null, cod_cliente, 'S']
      );
    }
    
    // 5. Insere CPF ou CNPJ
    if (documento) {
      if (tipo_cliente === 'PF') {
        await txExecute(connection,
          'INSERT INTO Pessoa_Fisica (cod_cliente, cpf) VALUES (?, ?)',
          [cod_cliente, documento]
        );
      } else if (tipo_cliente === 'PJ') {
        await txExecute(connection,
          'INSERT INTO Pessoa_Juridica (cod_cliente, cnpj) VALUES (?, ?)',
          [cod_cliente, documento]
        );
      }
    }
    
    await connection.commit();
    if (ENABLE_SQL_LOG) console.log('[TX] COMMIT createClient');
    return { insertId: cod_cliente };
  } catch (error) {
    await connection.rollback();
    if (ENABLE_SQL_LOG) console.log('[TX] ROLLBACK createClient');
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
  const { client_id, items, notes, forma_pag = 'Dinheiro', status = 'Pendente', address_id = null } = orderData;
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (ENABLE_SQL_LOG) console.log('[TX] BEGIN createOrder');
    
    // 1. Cria Atendimento
    const [maxAtend] = await txQuery(connection, 'SELECT COALESCE(MAX(cod_atendimento), 0) + 1 as next_id FROM Atendimento');
    const cod_atendimento = maxAtend[0].next_id;
    if (ENABLE_SQL_LOG) console.log('[TX] -> next cod_atendimento =', cod_atendimento);
    
    // Busca primeiro atendente disponível (simplificado)
    const [atendente] = await txQuery(connection, 'SELECT cod_atendente FROM Atendente LIMIT 1');
    
    await txExecute(connection,
      'INSERT INTO Atendimento (cod_atendimento, cod_cliente, cod_atendente) VALUES (?, ?, ?)',
      [cod_atendimento, client_id, atendente[0].cod_atendente]
    );
    
    // 2. Define endereço do pedido
    let cod_endereco = address_id;
    if (!cod_endereco) {
      const [endereco] = await txQuery(connection,
        'SELECT cod_endereco FROM Endereco_Entrega WHERE cod_cliente = ? AND principal = "S" LIMIT 1',
        [client_id]
      );
      if (!endereco[0]) throw new Error('Cliente sem endereço cadastrado');
      cod_endereco = endereco[0].cod_endereco;
    }
    
    // 3. Cria Pedido
    const [maxPed] = await txQuery(connection, 'SELECT COALESCE(MAX(cod_pedido), 0) + 1 as next_id FROM Pedido');
    const cod_pedido = maxPed[0].next_id;
    if (ENABLE_SQL_LOG) console.log('[TX] -> next cod_pedido =', cod_pedido);
    
    await txExecute(connection,
      'INSERT INTO Pedido (cod_pedido, status, forma_pag, observacao, cod_atendimento, cod_endereco) VALUES (?, ?, ?, ?, ?, ?)',
      [cod_pedido, status, forma_pag, notes || null, cod_atendimento, cod_endereco]
    );
    
    // 4. Insere Item_Pedido para cada produto
    for (const item of items) {
      // Busca cod_produto pelo nome
      const [produto] = await txQuery(connection, 'SELECT cod_produto FROM Produto WHERE nome LIKE ? LIMIT 1', [`%${item.product}%`]);
      
      if (produto[0]) {
        await txExecute(connection,
          'INSERT INTO Item_Pedido (cod_pedido, cod_produto, quantidade) VALUES (?, ?, ?)',
          [cod_pedido, produto[0].cod_produto, item.quantity]
        );
      }
    }
    
    await connection.commit();
    if (ENABLE_SQL_LOG) console.log('[TX] COMMIT createOrder');
    return cod_pedido;
  } catch (error) {
    await connection.rollback();
    if (ENABLE_SQL_LOG) console.log('[TX] ROLLBACK createOrder');
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Busca pedido (e itens) relacionado a um atendimento
 */
async function getOrderByAtendimento(atendimentoId) {
  const orderSql = `
    SELECT 
      p.cod_pedido as id,
      p.data_pedido as created_at,
      p.status,
      p.forma_pag as payment_method,
      p.observacao as notes,
      e.logradouro, e.numero, e.complemento, e.bairro, e.ponto_ref
    FROM Pedido p
    INNER JOIN Endereco_Entrega e ON p.cod_endereco = e.cod_endereco
    WHERE p.cod_atendimento = ?
    LIMIT 1
  `;
  const orders = await query(orderSql, [atendimentoId]);
  if (!orders.length) return null;
  const order = orders[0];

  const itemsSql = `
    SELECT pr.nome as product, ip.quantidade as quantity, pr.valor as price
    FROM Item_Pedido ip
    INNER JOIN Produto pr ON pr.cod_produto = ip.cod_produto
    WHERE ip.cod_pedido = ?
  `;
  const items = await query(itemsSql, [order.id]);
  order.items = items;
  return order;
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
  searchClients,
  createClient,
  getClientPhones,
  addPhone,
  getClientAddresses,
  addAddress,
  setPrimaryAddress,
  deleteAddress,
  // Pedidos
  getClientOrderHistory,
  createOrder,
  // Logs
  getAllLogs,
  createLog,
  // Produtos
  getAllProducts,
  // Relacionamentos
  getOrderByAtendimento
};
