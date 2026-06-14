-- =====================================================
-- MIGRAÇÃO: Adiciona campo data_validade à tabela produto
-- Execute este script caso o banco já esteja criado
-- =====================================================

USE `desklino`;

-- Adiciona a coluna data_validade se ainda não existir
ALTER TABLE `produto`
  ADD COLUMN IF NOT EXISTS `data_validade` date DEFAULT NULL;

-- Trigger: marca produto como indisponível automaticamente ao editar com data vencida
DROP TRIGGER IF EXISTS `trg_produto_validade_update`;

DELIMITER $$
CREATE TRIGGER `trg_produto_validade_update`
BEFORE UPDATE ON `produto`
FOR EACH ROW
BEGIN
    IF NEW.data_validade IS NOT NULL AND NEW.data_validade < CURDATE() THEN
        SET NEW.disponivel = 'N';
    END IF;
END$$
DELIMITER ;
