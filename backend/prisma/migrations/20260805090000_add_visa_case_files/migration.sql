-- Attach an uploaded document to one visa case.
-- Nullable on purpose: existing rows stay client-level and keep working.
ALTER TABLE `client_files` ADD COLUMN `visaCaseId` VARCHAR(191) NULL;

CREATE INDEX `client_files_visaCaseId_idx` ON `client_files`(`visaCaseId`);

ALTER TABLE `client_files`
  ADD CONSTRAINT `client_files_visaCaseId_fkey`
  FOREIGN KEY (`visaCaseId`) REFERENCES `visa_cases`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
