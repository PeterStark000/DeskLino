SET NAMES 'utf8mb4';
SET CHARACTER SET utf8mb4;
SET collation_connection = 'utf8mb4_unicode_ci';

CREATE DATABASE IF NOT EXISTS desklino
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE desklino;

CREATE TABLE IF NOT EXISTS Cliente (
    cod_cliente SMALLINT PRIMARY KEY NOT NULL,
    nome VARCHAR(50) NOT NULL,
    email VARCHAR(75) NOT NULL UNIQUE,
    tipo_cliente CHAR(2) NOT NULL,
    observacoes VARCHAR(255),
    CHECK (tipo_cliente IN ('PF', 'PJ'))
);

CREATE TABLE IF NOT EXISTS Pessoa_Fisica (
    cod_cliente SMALLINT PRIMARY KEY NOT NULL,
    cpf CHAR(11) NOT NULL UNIQUE,
    FOREIGN KEY (cod_cliente) REFERENCES Cliente(cod_cliente)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Pessoa_Juridica (
    cod_cliente SMALLINT PRIMARY KEY NOT NULL,
    cnpj CHAR(14) NOT NULL UNIQUE,
    FOREIGN KEY (cod_cliente) REFERENCES Cliente(cod_cliente)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Telefone (
    cod_telefone MEDIUMINT PRIMARY KEY NOT NULL,
    cod_cliente SMALLINT NOT NULL,
    numero VARCHAR(20) NOT NULL UNIQUE,
    FOREIGN KEY (cod_cliente) REFERENCES Cliente(cod_cliente)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Endereco_Entrega (
    cod_endereco MEDIUMINT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    nome_end VARCHAR(50) NOT NULL,
    logradouro VARCHAR(100) NOT NULL,
    numero VARCHAR(5) NOT NULL,
    complemento VARCHAR(50),
    bairro VARCHAR(50) NOT NULL,
    ponto_ref VARCHAR(100),
    cod_cliente SMALLINT NOT NULL,
    principal CHAR(1) NOT NULL,
    FOREIGN KEY (cod_cliente) REFERENCES Cliente(cod_cliente)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CHECK (principal IN ('S', 'N'))
);

CREATE TABLE IF NOT EXISTS Atendente (
    cod_atendente SMALLINT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    login VARCHAR(50) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo_usuario VARCHAR(10) NOT NULL DEFAULT 'atendente'
);

CREATE TABLE IF NOT EXISTS Atendimento (
    cod_atendimento INT PRIMARY KEY NOT NULL,
    data_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cod_cliente SMALLINT NOT NULL,
    cod_atendente SMALLINT NOT NULL,
    FOREIGN KEY (cod_cliente) REFERENCES Cliente(cod_cliente)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (cod_atendente) REFERENCES Atendente(cod_atendente)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Pedido (
    cod_pedido INT PRIMARY KEY NOT NULL,
    data_pedido TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) NOT NULL,
    forma_pag VARCHAR(30) NOT NULL,
    observacao TEXT,
    cod_atendimento INT NOT NULL,
    cod_endereco MEDIUMINT NOT NULL,
    FOREIGN KEY (cod_atendimento) REFERENCES Atendimento(cod_atendimento)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (cod_endereco) REFERENCES Endereco_Entrega(cod_endereco)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Produto (
    cod_produto INT PRIMARY KEY NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    valor DECIMAL(6,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS Item_Pedido (
    cod_pedido INT NOT NULL,
    cod_produto INT NOT NULL,
    quantidade SMALLINT NOT NULL,
    PRIMARY KEY (cod_pedido, cod_produto),
    FOREIGN KEY (cod_pedido) REFERENCES Pedido(cod_pedido)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (cod_produto) REFERENCES Produto(cod_produto)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

INSERT INTO Cliente (cod_cliente, nome, email, tipo_cliente, observacoes)
VALUES
(1, 'Sr. Carlos Almeida', 'carlos.almeida@email.com', 'PF', 'Prefere troco para R$ 50,00. Cuidado com o cachorro (Pipoca).'),
(2, 'Dona Helena Marques', 'helena.marques@email.com', 'PF', 'Cliente fiel. Prefere entregas pela manhã.'),
(3, 'Construtora Alfa Ltda.', 'contato@construtoraalfa.com', 'PJ', 'Cliente corporativo. Pagamento via boleto.'),
(4, 'Supermercado BomPreço', 'compras@bompreco.com', 'PJ', 'Cliente de alto volume. Negociação mensal.'),
(5, 'Eduardo Lima', 'edu.lima@email.com', 'PF', 'Cliente novo. Verificar endereço antes da entrega.'),
(6, 'Padaria Pão Doce', 'contato@paodoce.com', 'PJ', 'Entrega diária de botijões.'),
(7, 'Fernanda Costa', 'fernanda.costa@email.com', 'PF', 'Cliente pontual. Sempre paga via Pix.'),
(8, 'Restaurante Sabor & Cia', 'gerente@saborcia.com', 'PJ', 'Cliente fixo de alto consumo.'),
(9, 'Ricardo Santos', 'ricardo.santos@email.com', 'PF', 'Prefere entrega após as 18h.'),
(10, 'Posto Nova Era', 'compras@postoera.com', 'PJ', 'Recebe entregas no depósito lateral.'),
(11, 'Mariana Tavares', 'mariana.tavares@email.com', 'PF', 'Cliente indicada por Dona Helena.'),
(12, 'Oficina Rápida Express', 'orcamentos@expressauto.com', 'PJ', 'Entrega de gás industrial.'),
(13, 'André Oliveira', 'andre.oliveira@email.com', 'PF', 'Cliente novo, confirmar pagamento.'),
(14, 'Mercado Boa Compra', 'contato@boacompra.com', 'PJ', 'Cliente corporativo com pagamento mensal.'),
(15, 'Cláudia Ferreira', 'claudia.ferreira@email.com', 'PF', 'Cliente antiga, prefere botijão reserva.');

INSERT INTO Pessoa_Fisica (cod_cliente, cpf)
VALUES
(1, '12345678901'),
(2, '98765432100'),
(5, '23456789012'),
(7, '34567890123'),
(9, '45678901234'),
(11, '56789012345'),
(13, '67890123456'),
(15, '78901234567');

INSERT INTO Pessoa_Juridica (cod_cliente, cnpj)
VALUES
(3, '12345678000199'),
(4, '99887766000155'),
(6, '55443322000111'),
(8, '33221144000188'),
(10, '77889966000144'),
(12, '66554433000122'),
(14, '88990077000133');

INSERT INTO Telefone (cod_telefone, cod_cliente, numero)
VALUES
(1, 1, '(11) 98765-4321'),
(2, 2, '(21) 98888-2222'),
(3, 3, '(31) 97777-3333'),
(4, 4, '(41) 96666-4444'),
(5, 5, '(11) 95555-1111'),
(6, 6, '(11) 98877-5555'),
(7, 7, '(21) 91234-8888'),
(8, 8, '(21) 97777-9999'),
(9, 9, '(31) 99876-3333'),
(10, 10, '(41) 92345-6666'),
(11, 11, '(61) 93456-7777'),
(12, 12, '(31) 94455-8888'),
(13, 13, '(11) 91122-3333'),
(14, 14, '(71) 92233-4444'),
(15, 15, '(85) 93344-5555');

INSERT INTO Endereco_Entrega (cod_endereco, nome_end, logradouro, numero, complemento, bairro, ponto_ref, cod_cliente, principal)
VALUES
(1, 'Casa', 'Rua das Flores', '123', NULL, 'Centro', 'Casa azul, portão branco', 1, 'S'),
(2, 'Trabalho', 'Av. Paulista', '1500', 'Sala 801', 'Bela Vista', 'Próximo ao metrô', 1, 'N'),
(3, 'Residência', 'Rua dos Lírios', '89', NULL, 'Jardim Primavera', 'Perto da praça', 2, 'S'),
(4, 'Obra Central', 'Rua do Concreto', '500', NULL, 'Industrial', 'Depósito 2', 3, 'S'),
(5, 'Filial Curitiba', 'Av. Paraná', '2345', 'Galpão B', 'Boa Vista', 'Próximo ao posto', 4, 'S'),
(6, 'Apartamento', 'Rua Bela Vista', '101', 'Ap 23', 'Centro', 'Próximo ao mercado', 5, 'S'),
(7, 'Loja Matriz', 'Rua do Pão', '45', NULL, 'Vila Nova', 'Em frente à escola', 6, 'S'),
(8, 'Filial Zona Sul', 'Av. Santo Amaro', '1900', NULL, 'Santo Amaro', 'Próximo ao shopping', 6, 'N'),
(9, 'Casa', 'Rua das Palmeiras', '222', NULL, 'Jardim das Rosas', 'Casa amarela', 7, 'S'),
(10, 'Restaurante', 'Av. das Nações', '678', NULL, 'Centro', 'Ao lado do banco', 8, 'S'),
(11, 'Obra Secundária', 'Rua dos Tijolos', '700', NULL, 'Industrial', 'Portão azul', 3, 'N'),
(12, 'Residência', 'Rua do Sol', '99', NULL, 'Santa Luzia', 'Próximo à praça', 9, 'S'),
(13, 'Posto Central', 'Av. Brasil', '5000', NULL, 'Centro', 'Depósito lateral', 10, 'S'),
(14, 'Apartamento', 'Rua das Oliveiras', '34', 'Bloco C Ap 14', 'Jardim Botânico', 'Perto da academia', 11, 'S'),
(15, 'Galpão Industrial', 'Rua das Máquinas', '400', NULL, 'Distrito Norte', 'Depósito principal', 12, 'S'),
(16, 'Casa', 'Rua do Bosque', '82', NULL, 'Vila Verde', 'Frente ao ponto de ônibus', 13, 'S'),
(17, 'Mercado Central', 'Av. Getúlio Vargas', '210', NULL, 'Centro', 'Ao lado da farmácia', 14, 'S'),
(18, 'Filial Norte', 'Rua Amazonas', '150', NULL, 'Jardim América', 'Perto do posto', 14, 'N'),
(19, 'Residência', 'Rua das Hortênsias', '75', NULL, 'Vila Bela', 'Casa com portão cinza', 15, 'S'),
(20, 'Casa de Praia', 'Av. Atlântica', '321', NULL, 'Beira Mar', 'Em frente à barraca Sol Nascente', 15, 'N');

INSERT INTO Atendente (cod_atendente, nome, login, senha, tipo_usuario)
VALUES
(1, 'Admin Principal', 'admin.user', 'hash_admin', 'admin'),
(2, 'Lucas Nunes', 'atendente.01', 'hash_lucas', 'atendente'),
(3, 'Jean Vitor', 'atendente.02', 'hash_jean', 'atendente'),
(4, 'Daniel Marques', 'atendente.03', 'hash_daniel', 'atendente'),
(5, 'João Gabriel', 'atendente.04', 'hash_joao', 'atendente');

INSERT INTO Produto (cod_produto, nome, descricao, valor)
VALUES
(1, 'Botijão P13', 'Botijão de gás GLP 13kg', 105.00),
(2, 'Botijão P20', 'Botijão de gás GLP 20kg', 150.00),
(3, 'Botijão P45', 'Botijão de gás GLP 45kg industrial', 320.00),
(4, 'Água Mineral 20L', 'Galão de água mineral 20 litros', 18.00),
(5, 'Água com Gás 20L', 'Galão de água com gás 20 litros', 22.00),
(6, 'Suporte para Botijão', 'Suporte metálico para botijão de gás', 45.00),
(7, 'Mangueira de Gás 1m', 'Mangueira para instalação de gás 1 metro', 15.00),
(8, 'Mangueira de Gás 2m', 'Mangueira para instalação de gás 2 metros', 25.00),
(9, 'Regulador de Gás', 'Regulador de pressão para botijão', 35.00),
(10, 'Abraçadeira Metálica', 'Abraçadeira para fixação de mangueira', 5.00);