DROP DATABASE IF EXISTS desklino;
CREATE DATABASE desklino CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE desklino;

-- ==========================
-- TABELA: atendente
-- ==========================
DROP TABLE IF EXISTS atendente;
CREATE TABLE atendente (
  cod_atendente SMALLINT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(150) NOT NULL,
  login VARCHAR(50) NOT NULL,
  senha VARCHAR(255) NOT NULL,
  tipo_usuario VARCHAR(10) NOT NULL DEFAULT 'atendente',
  PRIMARY KEY (cod_atendente),
  UNIQUE (login)
);

INSERT INTO atendente VALUES
(1,'Admin Principal','admin.user','hash_admin','admin'),
(2,'Lucas Nunes','atendente.01','hash_lucas','atendente'),
(3,'Jean Vitor','atendente.02','hash_jean','atendente'),
(4,'Daniel Marques','atendente.03','hash_daniel','atendente'),
(5,'João Gabriel','atendente.04','hash_joao','atendente');

-- ==========================
-- TABELA: cliente
-- ==========================
DROP TABLE IF EXISTS cliente;
CREATE TABLE cliente (
  cod_cliente SMALLINT NOT NULL,
  nome VARCHAR(50) NOT NULL,
  email VARCHAR(75) NOT NULL,
  tipo_cliente CHAR(2) NOT NULL,
  observacoes VARCHAR(255),
  PRIMARY KEY (cod_cliente),
  UNIQUE (email),
  CHECK (tipo_cliente IN ('PF','PJ'))
);

INSERT INTO cliente VALUES
(1,'Sr. Carlos Almeida','carlos.almeida@email.com','PF','Prefere troco para R$ 50,00. Cuidado com o cachorro (Pipoca).'),
(2,'Dona Helena Marques','helena.marques@email.com','PF','Cliente fiel. Prefere entregas pela manhã.'),
(3,'Construtora Alfa Ltda.','contato@construtoraalfa.com','PJ','Cliente corporativo. Pagamento via boleto.'),
(4,'Supermercado BomPreço','compras@bompreco.com','PJ','Cliente de alto volume. Negociação mensal.'),
(5,'Eduardo Lima','edu.lima@email.com','PF','Cliente novo. Verificar endereço antes da entrega.'),
(6,'Padaria Pão Doce','contato@paodoce.com','PJ','Entrega diária de botijões.'),
(7,'Fernanda Costa','fernanda.costa@email.com','PF','Cliente pontual. Sempre paga via Pix.'),
(8,'Restaurante Sabor & Cia','gerente@saborcia.com','PJ','Cliente fixo de alto consumo.'),
(9,'Ricardo Santos','ricardo.santos@email.com','PF','Prefere entrega após as 18h.'),
(10,'Posto Nova Era','compras@postoera.com','PJ','Recebe entregas no depósito lateral.'),
(11,'Mariana Tavares','mariana.tavares@email.com','PF','Cliente indicada por Dona Helena.'),
(12,'Oficina Rápida Express','orcamentos@expressauto.com','PJ','Entrega de gás industrial.'),
(13,'André Oliveira','andre.oliveira@email.com','PF','Cliente novo, confirmar pagamento.'),
(14,'Mercado Boa Compra','contato@boacompra.com','PJ','Cliente corporativo com pagamento mensal.'),
(15,'Cláudia Ferreira','claudia.ferreira@email.com','PF','Cliente antiga, prefere botijão reserva.'),
(16,'Jean Vitor','cliente16@desklino.com','PF','Cliente cadeirante, pouca mobilidade.'),
(17,'João Gabriel','joaogabrielcarvalho@gmail.com','PF',''),
(18,'Anderson Araujo','cliente18@desklino.com','PF','Pitbull bravo, tomar cuidado.'),
(19,'Daniel Oliveira','danioliver@gmail.com','PF','Prefere troco para 100 reais.');

-- ==========================
-- TABELA: atendimento
-- ==========================
DROP TABLE IF EXISTS atendimento;
CREATE TABLE atendimento (
  cod_atendimento INT NOT NULL,
  data_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cod_cliente SMALLINT NOT NULL,
  cod_atendente SMALLINT NOT NULL,
  PRIMARY KEY (cod_atendimento),
  FOREIGN KEY (cod_cliente) REFERENCES cliente (cod_cliente) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (cod_atendente) REFERENCES atendente (cod_atendente) ON UPDATE CASCADE
);

INSERT INTO atendimento VALUES
(1,'2025-11-13 19:48:55',1,1),
(2,'2025-11-13 20:17:44',1,1),
(3,'2025-11-13 20:23:01',16,1),
(4,'2025-11-13 21:18:40',1,1),
(5,'2025-11-13 21:19:46',1,1),
(6,'2025-11-13 21:21:19',1,1),
(7,'2025-11-13 21:41:01',17,1),
(8,'2025-11-13 22:11:49',17,1),
(9,'2025-11-13 23:21:05',18,1),
(10,'2025-11-13 23:56:39',1,1),
(11,'2025-11-14 00:07:06',19,1);

-- ==========================
-- TABELA: endereco_entrega
-- ==========================
DROP TABLE IF EXISTS endereco_entrega;
CREATE TABLE endereco_entrega (
  cod_endereco MEDIUMINT NOT NULL AUTO_INCREMENT,
  nome_end VARCHAR(50) NOT NULL,
  logradouro VARCHAR(100) NOT NULL,
  numero VARCHAR(5) NOT NULL,
  complemento VARCHAR(50),
  bairro VARCHAR(50) NOT NULL,
  ponto_ref VARCHAR(100),
  cod_cliente SMALLINT NOT NULL,
  principal CHAR(1) NOT NULL,
  PRIMARY KEY (cod_endereco),
  FOREIGN KEY (cod_cliente) REFERENCES cliente(cod_cliente)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CHECK (principal IN ('S','N'))
);

INSERT INTO endereco_entrega VALUES
(1,'Casa','Rua das Flores','123',NULL,'Centro','Casa azul, portão branco',1,'S'),
(2,'Trabalho','Av. Paulista','1500','Sala 801','Bela Vista','Próximo ao metrô',1,'N'),
(3,'Residência','Rua dos Lírios','89',NULL,'Jardim Primavera','Perto da praça',2,'S'),
(4,'Obra Central','Rua do Concreto','500',NULL,'Industrial','Depósito 2',3,'S'),
(5,'Filial Curitiba','Av. Paraná','2345','Galpão B','Boa Vista','Próximo ao posto',4,'S'),
(6,'Apartamento','Rua Bela Vista','101','Ap 23','Centro','Próximo ao mercado',5,'S'),
(7,'Loja Matriz','Rua do Pão','45',NULL,'Vila Nova','Em frente à escola',6,'S'),
(8,'Filial Zona Sul','Av. Santo Amaro','1900',NULL,'Santo Amaro','Próximo ao shopping',6,'N'),
(9,'Casa','Rua das Palmeiras','222',NULL,'Jardim das Rosas','Casa amarela',7,'S'),
(10,'Restaurante','Av. das Nações','678',NULL,'Centro','Ao lado do banco',8,'S'),
(11,'Obra Secundária','Rua dos Tijolos','700',NULL,'Industrial','Portão azul',3,'N'),
(12,'Residência','Rua do Sol','99',NULL,'Santa Luzia','Próximo à praça',9,'S'),
(13,'Posto Central','Av. Brasil','5000',NULL,'Centro','Depósito lateral',10,'S'),
(14,'Apartamento','Rua das Oliveiras','34','Bloco C Ap 14','Jardim Botânico','Perto da academia',11,'S'),
(15,'Galpão Industrial','Rua das Máquinas','400',NULL,'Distrito Norte','Depósito principal',12,'S'),
(16,'Casa','Rua do Bosque','82',NULL,'Vila Verde','Frente ao ponto de ônibus',13,'S'),
(17,'Mercado Central','Av. Getúlio Vargas','210',NULL,'Centro','Ao lado da farmácia',14,'S'),
(18,'Filial Norte','Rua Amazonas','150',NULL,'Jardim América','Perto do posto',14,'N'),
(19,'Residência','Rua das Hortênsias','75',NULL,'Vila Bela','Casa com portão cinza',15,'S'),
(20,'Casa de Praia','Av. Atlântica','321',NULL,'Beira Mar','Em frente à barraca Sol Nascente',15,'N'),
(21,'Casa','Rua Botafogo','S/N',NULL,'Major Prates','Em frente a Minas Brasil',16,'S'),
(22,'Principal','Rua 2','S/N',NULL,'Major',NULL,17,'N'),
(23,'Casa da Avó','Rua Sebastião Campos','540','Apartamento','Nova Londres','Em frente ao salão de festas Oh Bah',17,'S'),
(25,'Principal','Rua Unimontes','S/N',NULL,'Rocinha','Favela',18,'S'),
(26,'Principal','Rua Macaco Prego','S/N',NULL,'Zoologico','Muro alto, porta de ferro.',19,'S');

-- ==========================
-- TABELA: produto
-- ==========================
DROP TABLE IF EXISTS produto;
CREATE TABLE produto (
  cod_produto INT NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  valor DECIMAL(6,2) NOT NULL,
  qtde_estoque SMALLINT NOT NULL DEFAULT 0,
  disponivel CHAR(1) NOT NULL DEFAULT 'S',
  PRIMARY KEY (cod_produto)
);

INSERT INTO produto (cod_produto, nome, descricao, valor, qtde_estoque) VALUES
(1, 'GLP Cilindro P20', 'Cilindro de GLP modelo P20 para uso residencial e comercial.', 293.00, 293),
(2, 'GLP Botijão P13', 'Botijão de GLP modelo P13, padrão residencial.', 120.00, 3000),
(3, 'GLP Cilindro P45', 'Cilindro de GLP modelo P45, uso industrial.', 460.00, 350),
(4, 'Botijão Vazio P20', 'Botijão vazio modelo P20 para troca.', 0.00, 127),
(5, 'Botijão Vazio P13', 'Botijão vazio modelo P13 para reposição ou troca.', 200.00, 3000),
(6, 'Água Galão 10L', 'Galão de água mineral Igarapé com 10 litros.', 12.00, 1500),
(7, 'Água Galão 20L', 'Galão de água mineral Igarapé com 20 litros.', 19.00, 2000),
(8, 'Água 510mL Sem Gás', 'Água mineral Igarapé 510 mL sem gás.', 6.55, 294),
(9, 'Botijão Vazio P45', 'Botijão vazio modelo P45 industrial.', 0.00, 87),
(10, 'Água PET 1,5L C/6', 'Pacote com 6 garrafas de água 1,5L Igarapé sem gás.', 16.00, 0),
(11, 'Água PET 500mL C/12 Gás', 'Pacote com 12 unidades de água Igarapé 500mL com gás.', 22.00, 58),
(12, 'Água PET 5L C/2', 'Pacote com 2 garrafas de água Igarapé 5 litros.', 16.00, 0),
(13, 'Água PET 500mL C/12', 'Pacote com 12 unidades de água 500mL Água Azul sem gás.', 14.00, 200),
(14, 'Copo Descartável 48un', 'Caixa com 48 copos descartáveis.', 38.00, 0),
(15, 'Galão Vazio 20L', 'Vasilhame vazio de 20 litros para troca.', 11.00, 100),
(16, 'Água Copo 200mL C/48', 'Fardo com 48 copos de água 200mL Igarapé.', 40.00, 2),
(17, 'Regulador de Gás NS05C10', 'Regulador de gás sem manômetro, modelo NS05C10, 1kg.', 50.00, 40),
(18, 'Regulador de Gás ALIAS04C10', 'Regulador de gás sem manômetro, modelo ALIAS04C10, 1kg.', 50.00, 20),
(19, 'Mangueira 3/8"', 'Mangueira transparente 3/8" tarja azul.', 10.00, 1),
(20, 'Abraçadeira 13–19mm', 'Abraçadeira RSF 13–19mm para mangueira de gás.', 2.50, 10),
(21, 'Água 500mL Tropical', 'Garrafa de água 500mL marca Tropical.', 14.00, 5),
(22, 'Água 500mL Pura da Serra', 'Água mineral 500mL sem gás marca Pura da Serra.', 14.00, 0),
(23, 'Água 1,5L Tropical', 'Garrafa de água 1,5L marca Tropical.', 14.00, 0),
(24, 'Água 1,5L Pura da Serra', 'Garrafa de água 1,5L da marca Pura da Serra.', 14.00, 0),
(25, 'Água 1,5L Com Gás', 'Garrafa de água 1,5L Igarapé com gás.', 22.00, 0),
(26, 'Água PET 500mL C/6', 'Pacote com 6 unidades de água 500mL Igarapé sem gás.', 16.00, 80),
(27, 'Garrafão PP', 'Vasilhame de garrafão tipo PP para água.', 20.00, 1541),
(28, 'Água 1,5L Água Azul', 'Garrafa de água 1,5L marca Água Azul.', 14.00, 0),
(29, 'Água Igarapé 10L', 'Água mineral Igarapé em garrafa PET de 10 litros.', 16.00, 10);


-- ==========================
-- TABELA: pedido
-- ==========================
DROP TABLE IF EXISTS pedido;
CREATE TABLE pedido (
  cod_pedido INT NOT NULL,
  data_pedido TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(30) NOT NULL,
  forma_pag VARCHAR(30) NOT NULL,
  valor_total DECIMAL(8,2) NOT NULL,
  observacao TEXT,
  cod_atendimento INT NOT NULL,
  cod_endereco MEDIUMINT NOT NULL,
  PRIMARY KEY (cod_pedido),
  FOREIGN KEY (cod_atendimento) REFERENCES atendimento (cod_atendimento)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (cod_endereco) REFERENCES endereco_entrega (cod_endereco)
    ON UPDATE CASCADE
);

INSERT INTO pedido (cod_pedido, data_pedido, status, forma_pag, valor_total, observacao, cod_atendimento, cod_endereco) VALUES
(1,'2025-11-13 19:48:55','Pendente','Dinheiro',1415.00,NULL,1,1),
(2,'2025-11-13 20:17:44','Pendente','Dinheiro',413.00,NULL,2,1),
(3,'2025-11-13 20:23:01','Pendente','Dinheiro',16.00,NULL,3,21),
(4,'2025-11-13 21:18:40','Pendente','Dinheiro',895.00,NULL,4,1),
(5,'2025-11-13 21:19:46','Pendente','Dinheiro',0.00,NULL,5,1),
(6,'2025-11-13 21:21:19','Pendente','Dinheiro',48.00,'Teste',6,1),
(7,'2025-11-13 21:41:01','Pendente','Dinheiro',293.00,NULL,7,22),
(8,'2025-11-13 22:11:49','Pendente','Dinheiro',36.00,NULL,8,22),
(9,'2025-11-13 23:21:05','Pendente','Dinheiro',600.00,'Pitbul bravo',9,25),
(10,'2025-11-13 23:56:39','Pendente','Dinheiro',48.00,NULL,10,1),
(11,'2025-11-14 00:07:06','Entregue','Dinheiro',460.00,'Prefere troco para 100 reais.',11,26);

-- ==========================
-- TABELA: item_pedido
-- ==========================
DROP TABLE IF EXISTS item_pedido;
CREATE TABLE item_pedido (
  cod_pedido INT NOT NULL,
  cod_produto INT NOT NULL,
  quantidade SMALLINT NOT NULL,
  PRIMARY KEY (cod_pedido, cod_produto),
  FOREIGN KEY (cod_pedido) REFERENCES pedido (cod_pedido) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (cod_produto) REFERENCES produto(cod_produto) ON UPDATE CASCADE
);

INSERT INTO item_pedido VALUES
(1,3,3),(1,7,1),(1,10,1),
(2,1,1),(2,2,1),(2,4,5),
(3,10,1),
(4,1,3),(4,10,1),
(5,4,3),
(6,10,3),
(7,1,1),
(8,6,3),
(9,5,3),
(10,10,3),
(11,3,1);

-- ==========================
-- TABELA: pessoa_fisica
-- ==========================
DROP TABLE IF EXISTS pessoa_fisica;
CREATE TABLE pessoa_fisica (
  cod_cliente SMALLINT NOT NULL,
  cpf CHAR(11) NOT NULL,
  PRIMARY KEY (cod_cliente),
  UNIQUE (cpf),
  FOREIGN KEY (cod_cliente) REFERENCES cliente(cod_cliente)
    ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO pessoa_fisica VALUES
(19,'10084848464'),
(16,'11515151515'),
(1,'12345678901'),
(17,'18151515118'),
(18,'18181818181'),
(5,'23456789012'),
(7,'34567890123'),
(9,'45678901234'),
(11,'56789012345'),
(13,'67890123456'),
(15,'78901234567'),
(2,'98765432100');

-- ==========================
-- TABELA: pessoa_juridica
-- ==========================
DROP TABLE IF EXISTS pessoa_juridica;
CREATE TABLE pessoa_juridica (
  cod_cliente SMALLINT NOT NULL,
  cnpj CHAR(14) NOT NULL,
  PRIMARY KEY (cod_cliente),
  UNIQUE (cnpj),
  FOREIGN KEY (cod_cliente) REFERENCES cliente(cod_cliente)
    ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO pessoa_juridica VALUES
(3,'12345678000199'),
(8,'33221144000188'),
(6,'55443322000111'),
(12,'66554433000122'),
(10,'77889966000144'),
(14,'88990077000133'),
(4,'99887766000155');

-- ==========================
-- TABELA: telefone
-- ==========================
DROP TABLE IF EXISTS telefone;
CREATE TABLE telefone (
  cod_telefone MEDIUMINT NOT NULL,
  cod_cliente SMALLINT NOT NULL,
  numero VARCHAR(20) NOT NULL,
  PRIMARY KEY (cod_telefone),
  UNIQUE (numero),
  FOREIGN KEY (cod_cliente) REFERENCES cliente(cod_cliente)
    ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO telefone VALUES
(1,1,'(11) 98765-4321'),
(2,2,'(21) 98888-2222'),
(3,3,'(31) 97777-3333'),
(4,4,'(41) 96666-4444'),
(5,5,'(11) 95555-1111'),
(6,6,'(11) 98877-5555'),
(7,7,'(21) 91234-8888'),
(8,8,'(21) 97777-9999'),
(9,9,'(31) 99876-3333'),
(10,10,'(41) 92345-6666'),
(11,11,'(61) 93456-7777'),
(12,12,'(31) 94455-8888'),
(13,13,'(11) 91122-3333'),
(14,14,'(71) 92233-4444'),
(15,15,'(85) 93344-5555'),
(16,16,'(11) 9876-5159'),
(17,1,'(38) 99985-1088'),
(18,17,'(38) 99999-9999'),
(19,18,'(38) 98998-9898'),
(20,18,'(21) 99999-0000'),
(21,19,'(21) 99999-0001'),
(22,18,'(21) 99999-0020');
