-- Partner agencies: sign in to the same app, see only what they submitted.
CREATE TABLE `agencies` (
  `id`           VARCHAR(191) NOT NULL,
  `name`         VARCHAR(191) NOT NULL,
  `contactName`  VARCHAR(191) NULL,
  `contactPhone` VARCHAR(191) NULL,
  `contactEmail` VARCHAR(191) NULL,
  `isActive`     BOOLEAN NOT NULL DEFAULT true,
  `createdAt`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`    DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- The checklist the desk expects. NULL country/visaType means "applies to all".
CREATE TABLE `required_documents` (
  `id`        VARCHAR(191) NOT NULL,
  `label`     VARCHAR(191) NOT NULL,
  `country`   VARCHAR(191) NULL,
  `visaType`  VARCHAR(191) NULL,
  `isActive`  BOOLEAN NOT NULL DEFAULT true,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `required_documents_country_idx`(`country`),
  INDEX `required_documents_visaType_idx`(`visaType`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Existing rows keep NULL, so nothing changes for the desk's own work.
ALTER TABLE `users` ADD COLUMN `agencyId` VARCHAR(191) NULL;
ALTER TABLE `visa_cases` ADD COLUMN `submittedByAgencyId` VARCHAR(191) NULL;

CREATE INDEX `visa_cases_submittedByAgencyId_idx` ON `visa_cases`(`submittedByAgencyId`);

ALTER TABLE `users`
  ADD CONSTRAINT `users_agencyId_fkey`
  FOREIGN KEY (`agencyId`) REFERENCES `agencies`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `visa_cases`
  ADD CONSTRAINT `visa_cases_submittedByAgencyId_fkey`
  FOREIGN KEY (`submittedByAgencyId`) REFERENCES `agencies`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Widen the role enum in place; MySQL keeps existing values untouched.
ALTER TABLE `users`
  MODIFY `role` ENUM('ADMIN', 'MANAGER', 'AGENT', 'VIEWER', 'AGENCY') NOT NULL DEFAULT 'AGENT';
