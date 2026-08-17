-- The decision statuses are no longer part of the workflow.
-- Existing approvals become RDV_OK; former refusals are retained as archived
-- applications so their client documents remain intact but no longer appear
-- in any active workflow.
UPDATE `visa_cases`
SET `currentStatus` = 'RDV_OK'
WHERE `currentStatus` = 'VISA_OK';

UPDATE `visa_cases`
SET
  `currentStatus` = 'EN_ATTENTE',
  `archived` = 1,
  `incompleteReason` = NULL,
  `notes` = CONCAT('[Archived after removal of visa refusal status] ', COALESCE(`notes`, ''))
WHERE `currentStatus` = 'VISA_REFUSEE';

-- Approval history remains meaningful after the merge. Refusal-history rows
-- are removed together with the retired status.
UPDATE `status_histories` SET `oldStatus` = 'RDV_OK' WHERE `oldStatus` = 'VISA_OK';
UPDATE `status_histories` SET `newStatus` = 'RDV_OK' WHERE `newStatus` = 'VISA_OK';
DELETE FROM `status_histories`
WHERE `oldStatus` = 'VISA_REFUSEE' OR `newStatus` = 'VISA_REFUSEE';

-- Guarded: production never had this table, and an unguarded DROP would abort
-- the migration after the updates above had already been applied.
DROP TABLE IF EXISTS `visa_details`;

ALTER TABLE `visa_cases`
  MODIFY `currentStatus` ENUM('EN_ATTENTE', 'DOSSIER_INCOMPLET', 'EN_TRAITEMENT', 'RDV_OK', 'LIVREE') NOT NULL DEFAULT 'EN_ATTENTE';

ALTER TABLE `status_histories`
  MODIFY `oldStatus` ENUM('EN_ATTENTE', 'DOSSIER_INCOMPLET', 'EN_TRAITEMENT', 'RDV_OK', 'LIVREE') NOT NULL,
  MODIFY `newStatus` ENUM('EN_ATTENTE', 'DOSSIER_INCOMPLET', 'EN_TRAITEMENT', 'RDV_OK', 'LIVREE') NOT NULL;
