-- The desk publishes up to three phone lines on its documents.
ALTER TABLE `agency_settings` ADD COLUMN `agencyPhone2` VARCHAR(191) NULL;
ALTER TABLE `agency_settings` ADD COLUMN `agencyPhone3` VARCHAR(191) NULL;
