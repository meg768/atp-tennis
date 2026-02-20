CREATE ALGORITHM = UNDEFINED DEFINER = `root` @`%` SQL SECURITY DEFINER VIEW `currently` AS
WITH
    ongoing_events AS (
        SELECT
            `e`.`id` AS `id`,
            `e`.`name` AS `name`,
            `e`.`date` AS `date`,
            `e`.`type` AS `type`
        FROM
            `events` `e`
        WHERE
            `e`.`type` IN ('Grand Slam', 'Masters', 'ATP-500', 'ATP-250')
            AND `e`.`date` >= CURDATE() - INTERVAL 14 day
            AND ! EXISTS (
                SELECT
                    1
                FROM
                    `matches` `m`
                WHERE
                    `m`.`event` = `e`.`id`
                    AND `m`.`round` = 'F'
                    AND `m`.`score` IS NOT NULL
                    AND `m`.`score` <> ''
                LIMIT
                    1
            )
    ),
    main_draw_matches AS (
        SELECT
            `m`.`id` AS `match_id`,
            `m`.`event` AS `event`,
            `m`.`round` AS `round`,
            `m`.`winner` AS `winner`,
            `m`.`loser` AS `loser`
        FROM
            `matches` `m`
        WHERE
            `m`.`round` IN ('F', 'SF', 'QF', 'R16', 'R32', 'R128')
    ),
    player_matches AS (
        SELECT
            `mdm`.`event` AS `event`,
            `mdm`.`match_id` AS `match_id`,
            `mdm`.`round` AS `round`,
            `mdm`.`winner` AS `winner`,
            `mdm`.`loser` AS `loser`,
            `mdm`.`winner` AS `player_id`,
            1 AS `is_winner`
        FROM
            `main_draw_matches` `mdm`
        UNION ALL
        SELECT
            `mdm`.`event` AS `event`,
            `mdm`.`match_id` AS `match_id`,
            `mdm`.`round` AS `round`,
            `mdm`.`winner` AS `winner`,
            `mdm`.`loser` AS `loser`,
            `mdm`.`loser` AS `player_id`,
            0 AS `is_winner`
        FROM
            `main_draw_matches` `mdm`
    ),
    ranked_player_matches AS (
        SELECT
            `pm`.`event` AS `event`,
            `pm`.`match_id` AS `match_id`,
            `pm`.`round` AS `round`,
            `pm`.`winner` AS `winner`,
            `pm`.`loser` AS `loser`,
            `pm`.`player_id` AS `player_id`,
            `pm`.`is_winner` AS `is_winner`,
            ROW_NUMBER() OVER (
                PARTITION BY
                    `pm`.`event`,
                    `pm`.`player_id`
                ORDER BY
                    CASE `pm`.`round`
                        WHEN 'F' THEN 6
                        WHEN 'SF' THEN 5
                        WHEN 'QF' THEN 4
                        WHEN 'R16' THEN 3
                        WHEN 'R32' THEN 2
                        WHEN 'R128' THEN 1
                        ELSE 0
                    END DESC,
                    `pm`.`match_id` DESC
            ) AS `rn`
        FROM
            `player_matches` `pm`
    ),
    alive_players AS (
        SELECT
            `rpm`.`event` AS `event`,
            `rpm`.`player_id` AS `player_id`,
            `rpm`.`round` AS `round`
        FROM
            `ranked_player_matches` `rpm`
        WHERE
            `rpm`.`rn` = 1
            AND `rpm`.`is_winner` = 1
    )
SELECT
    `oe`.`id` AS `event_id`,
    `oe`.`date` AS `event_date`,
    `oe`.`name` AS `event_name`,
    `oe`.`type` AS `event_type`,
    `p`.`id` AS `player_id`,
    `p`.`name` AS `player`,
    `p`.`country` AS `player_country`,
    `p`.`rank` AS `player_rank`,
    `ap`.`round` AS `round`
FROM
    (
        (
            `ongoing_events` `oe`
            JOIN `alive_players` `ap` ON (`ap`.`event` = `oe`.`id`)
        )
        JOIN `players` `p` ON (`p`.`id` = `ap`.`player_id`)
    )
ORDER BY
    `oe`.`date` DESC,
    `oe`.`name`,
    `p`.`rank` IS NULL,
    `p`.`rank`,
    `p`.`name`;