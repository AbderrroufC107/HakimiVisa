-- Ties an uploaded file to the required document it answers, so a partner's
-- upload slots can be filled reliably instead of guessed from the file name.
ALTER TABLE `client_files` ADD COLUMN `requiredDocumentId` VARCHAR(191) NULL;

CREATE INDEX `client_files_requiredDocumentId_idx` ON `client_files`(`requiredDocumentId`);

ALTER TABLE `client_files`
  ADD CONSTRAINT `client_files_requiredDocumentId_fkey`
  FOREIGN KEY (`requiredDocumentId`) REFERENCES `required_documents`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
