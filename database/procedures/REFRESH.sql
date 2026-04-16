DELIMITER ;;

DROP PROCEDURE IF EXISTS `REFRESH`;;

CREATE PROCEDURE `REFRESH`()
BEGIN
    /*
    REFRESH()

    Purpose
    - Provide one generic database entry point for refresh jobs.
    - Start simple and let this procedure grow as more rebuild steps are moved
      from Node into MariaDB.

    Current behavior
    - Rebuild total Elo.
    - Rebuild Hard Elo.
    - Rebuild Clay Elo.
    - Rebuild Grass Elo.

    Usage
    - CALL REFRESH();
    */

    CALL COMPUTE_ELO_RANK();
    CALL COMPUTE_ELO_RANK_SURFACE('Hard');
    CALL COMPUTE_ELO_RANK_SURFACE('Clay');
    CALL COMPUTE_ELO_RANK_SURFACE('Grass');
END;;

DELIMITER ;
