DROP PROCEDURE IF EXISTS sp_update;

DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `sp_update`()
BEGIN
    DECLARE exit handler FOR SQLEXCEPTION
    BEGIN
        CALL sp_log('sp_update: ERROR during execution');
        RESIGNAL;
    END;

    CALL sp_log('Updating after import procedures...');

    CALL sp_update_surface_factors();
    CALL sp_update_match_status(FALSE);

    CALL sp_log('Update finished successfully.');
END;;
DELIMITER ;
