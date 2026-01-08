ALTER TABLE `events` ADD COLUMN `end_date` DATE DEFAULT NULL AFTER `date`;
UPDATE `events` SET `end_date` = `date`;
ALTER TABLE `events` MODIFY COLUMN `end_date` DATE NOT NULL;
