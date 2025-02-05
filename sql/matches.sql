

TRUNCATE TABLE matches;

INSERT INTO matches (date, tournament, level, surface, draw, winner, loser, score, round, WIOC, LIOC, WRK, LRK, WACE, LACE, WDF, LDF)

SELECT 

    CAST(import.tourney_date AS DATE) AS date,
    import.tourney_name AS tournament,
    
    
    /* level */
    (
        SELECT (
            CASE import.tourney_level 
                WHEN 'O' THEN 'Olympics' 
                WHEN 'F' THEN 'Finals' 
                WHEN 'D' THEN 'Davis Cup'
                WHEN 'G' THEN 'Grand Slam' 
                WHEN 'M' THEN 'Masters' 
                WHEN 'A' THEN CASE import.draw_size
                    WHEN '32' THEN 'ATP-250'
                    WHEN '28' THEN 'ATP-250'
                    WHEN '64' THEN 'ATP-500'
                    WHEN '48' THEN 'ATP-500'
                    ELSE 'ATP Tour' 
                    END
                ELSE import.tourney_level
            END
        )
    ) AS level,


	/* surface */
    (
        SELECT (
        	CASE(import.surface)
        		WHEN '' THEN NULL
        		ELSE import.surface
        	END
        )
    ) AS surface,
    
    /* draw */
    (
        SELECT (
        	CASE(import.draw_size REGEXP '^[0-9]')
        		WHEN true THEN import.draw_size * 1
        		ELSE NULL
        	END
        )
    ) AS draw,


    import.winner_name AS winner,
    import.loser_name AS loser,


	import.score AS score,

    import.round AS round,

	/* WIOC */
    (
        SELECT (
        	CASE(import.winner_ioc)
        		WHEN '' THEN NULL
        		ELSE import.winner_ioc
        	END
        )
    ) AS WIOC,


	/* LIOC */
    (
        SELECT (
        	CASE(import.loser_ioc)
        		WHEN '' THEN NULL
        		ELSE import.loser_ioc
        	END
        )
    ) AS LIOC,


	/* WRK */
    (
        SELECT (
        	CASE(import.winner_rank)
        		WHEN '' THEN NULL
        		ELSE CAST(import.winner_rank AS INT)
        	END
        )
    ) AS WRK,    


	/* LRK */
    (
        SELECT (
        	CASE(import.loser_rank)
        		WHEN '' THEN NULL
        		ELSE CAST(import.loser_rank AS INT)
        	END
        )
    ) AS LRK,
    
    /* WACE */
    (
        SELECT (
        	CASE(import.w_svpt)
        		WHEN NULL THEN NULL
        		WHEN 0 THEN NULL
        		ELSE ROUND(import.w_ace * 100.0 / import.w_svpt, 1)
        	END
        )
    ) AS WACE,

	/* LACE */
    (
        SELECT (
        	CASE(import.l_svpt)
        		WHEN NULL THEN NULL
        		WHEN 0 THEN NULL
        		ELSE ROUND(import.l_ace * 100.0 / import.l_svpt, 1)
        	END
        )
    ) AS LACE,


	/* WDF */
    (
        SELECT (
        	CASE(import.w_svpt)
        		WHEN NULL THEN NULL
        		WHEN 0 THEN NULL
        		ELSE ROUND(import.w_df * 100.0 / import.w_svpt, 1)
        	END
        )
    ) AS WDF,

	/* LDF */
    (
        SELECT (
        	CASE(import.l_svpt)
        		WHEN NULL THEN NULL
        		WHEN 0 THEN NULL
        		ELSE ROUND(import.l_df * 100.0 / import.l_svpt, 1)
        	END
        )
    ) AS LDF

 
 
    FROM import;

