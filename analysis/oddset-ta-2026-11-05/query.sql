SELECT UTC_TIMESTAMP() AS checked_at_utc, id, time, event_name, player_name, opponent_name,
       player_oddset, opponent_oddset, player_ta, opponent_ta
FROM odds
ORDER BY time, id;
