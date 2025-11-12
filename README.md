# DeskLino

Sistema de atendimento e registro de pedidos e clientes (prototipo). Separado em páginas estáticas renderizadas por um servidor Express simples.

## Estrutura
```
src/
  assets/
    input.css         # Fonte + Tailwind entrada
    styles.css        # Gerado pelo build Tailwind
  pages/
    layout.html
    login.html
    atendimento_idle.html
    atendimento_identificado.html
    atendimento_novo.html
    admin_usuarios.html
    admin_logs.html
  scripts/
    main.js
    modules/
      auth.js         # Login/logout
      atendimento.js  # Telas de atendimento (idle, identificado, novo)
      admin.js        # Painel admin (usuários, logs)
  server/
    database.js         # Conexão MySQL + funções de acesso ao BD
    store.js            # Dados de exemplo (DEPRECADO - usar database.js)
index.js              # Servidor Express (rotas páginas + APIs)
```

## Instalação

### 1. Dependências Node.js
```powershell
npm install
npm run build:css
```
O script `postinstall` já tenta gerar o CSS automaticamente após `npm install`.

### 2. Configurar Banco de Dados MySQL
Execute o script `database/schema.sql` no MySQL para criar o banco `desklino` e suas tabelas:
```powershell
mysql -u root -p < database/schema.sql
```

### 3. Configurar Variáveis de Ambiente (Opcional)
Crie um arquivo `.env` na raiz ou defina as variáveis:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=desklino
```

Se não configurar, será usado `localhost`, `root` sem senha, e banco `desklino`.

## Executar
```powershell
node index.js
# ou ambiente de desenvolvimento com reinício automático
npm run dev
```
Acesse:
- Login: http://localhost:3000/login
- Atendimento (ocioso): http://localhost:3000/atendimento/idle
- Admin (usuários): http://localhost:3000/admin/usuarios
- Admin (logs): http://localhost:3000/admin/logs

## Autenticação Simples
- Qualquer usuário digitado é aceito.
- Senha `admin` => papel `admin`; qualquer outra => papel `atendente`.
- Dados básicos do usuário são armazenados em `localStorage`.

## APIs Disponíveis
- `POST /api/login` { username, password }
- `GET /api/usuarios` lista de usuários simulados
- `GET /api/logs` lista de logs simulados
- `GET /api/clientes/:telefone` busca cliente por telefone (ex: `(11) 98765-4321`)

## Desenvolvimento Frontend
Tailwind é compilado via CLI:
```powershell
npm run build:css
```
Inclua novas classes sempre dentro de arquivos listados em `tailwind.config.js`.

## Implementação Pendente (TODOs)
O projeto está preparado para integração com MySQL. Os seguintes itens precisam ser implementados em `server/database.js`:

1. **Autenticação**: `getUserByUsername()` + verificação de hash de senha (bcrypt)
2. **Usuários**: `getAllUsers()`, `updateUserRole()`
3. **Clientes**: `getClientByPhone()`, `createClient()`, `updateClientNotes()`, `deleteClient()`
4. **Pedidos**: `getClientOrderHistory()`, `createOrder()` (com suporte a múltiplos itens)
5. **Logs**: `getAllLogs()`, `createLog()`
6. **Produtos**: `getAllProducts()`

Todas as rotas em `index.js` possuem comentários `// TODO:` indicando onde implementar as chamadas ao banco.

## Próximos Passos
- Implementar funções de acesso ao banco em `server/database.js`
- Adicionar hash de senha com bcrypt no cadastro/login
- Sistema de sessão (cookies / JWT) ao invés de localStorage simples
- Validação de dados de entrada nas rotas API
- Testes automatizados (Jest/Supertest)

## Licença
Uso acadêmico / protótipo. Ajuste conforme necessidade.