/**
 * ARQUIVO DEPRECADO - Dados agora vêm do MySQL via server/database.js
 * 
 * Mantido apenas para referência de estrutura durante migração.
 * Os dados abaixo servem como exemplo do schema esperado:
 * 
 * Tabela `usuarios`: id, username, name, password_hash, role
 * Tabela `clientes`: id, phone, name, address, bairro, ref, notes
 * Tabela `pedidos`: id, client_id, notes, status, created_at
 * Tabela `pedido_itens`: id, order_id, product, quantity
 * Tabela `logs`: id, datetime, user, type, detail
 * Tabela `produtos`: id, name, price, available
 */

// Dados de exemplo (NÃO UTILIZADOS - apenas referência):
const EXAMPLE_users = [
  { id: 1, username: 'admin.user', name: 'Admin Principal', role: 'admin' },
  { id: 2, username: 'atendente.01', name: 'João Silva', role: 'atendente' },
  { id: 3, username: 'atendente.02', name: 'Maria Souza', role: 'atendente' },
];

const EXAMPLE_logs = [
  { datetime: '2025-11-05 09:30:15', user: 'João Silva', type: 'ATENDIMENTO', detail: 'Sr. Carlos Almeida', phone: '(11) 98765-4321' },
  { datetime: '2025-11-05 09:28:02', user: 'Maria Souza', type: 'ATENDIMENTO', detail: 'Dona Helena Marques', phone: '(21) 98888-2222' },
];

const EXAMPLE_customers = [
  {
    phone: '(11) 98765-4321',
    name: 'Sr. Carlos Almeida',
    address: 'Rua das Flores, 123 - Centro',
    ref: 'Casa azul, portão branco, ao lado da padaria.',
    notes: 'Cliente prefere troco para R$ 50,00. Cuidado com o cachorro (Pipoca).',
  }
];

const EXAMPLE_products = [
  { id: 1, name: 'Botijão P13', price: 95.00, available: true },
  { id: 2, name: 'Água 20L', price: 12.00, available: true },
  { id: 3, name: 'Botijão P45', price: 320.00, available: true },
  { id: 4, name: 'Garrafa Água 1L', price: 6.00, available: false },
];

module.exports = {
  EXAMPLE_users,
  EXAMPLE_logs,
  EXAMPLE_customers,
  EXAMPLE_products
};
