USE netms;

INSERT INTO BACKGROUND(NAME) VALUES
('Pre-Engineering'),
('Pre-Medical'),
('ICS'),
('ICom');

INSERT INTO TESTTYPE(NAME) VALUES
('Engineering and Applied Sciences'),
('Applied Biosciences'),
('Architecture'),
('Law'),
('Business');

INSERT INTO ELIGIBILITYRULE(TestTypeID,BackgroundID) VALUES
(1,1),(1,2),(1,3),
(2,2),
(3,1),(3,4),
(4,1),(4,2),(4,3),(4,4),
(5,1),(5,2),(5,3),(5,4);

INSERT INTO NetSeries(TimeWindow) Values
('Nov-Dec'),
('Jan-Mar'),
('Apr'),
('Jun-Jul');

INSERT INTO SeriesLocation(SeriesID,City) VALUES
(1,'Islamabad'),
(2,'Islamabad'),
(2,'Karachi'),
(2,'Quetta'),
(3,'Islamabad'),
(4,'Islamabad'),
(4,'Karachi'),
(4,'Quetta'),
(4,'Gilgit');

DELIMITER $$

CREATE PROCEDURE insert_date_range(
    IN seriesID INT,
    IN p_start DATE,
    IN p_end DATE
)
BEGIN
    WHILE p_start <= p_end DO
        INSERT INTO testDate (SeriesID, Date)
        VALUES (seriesID, p_start);
        SET p_start = DATE_ADD(p_start, INTERVAL 1 DAY);
    END WHILE;
END$$

DELIMITER ;

CALL insert_date_range(1,'2025-11-22', '2025-12-10');
CALL insert_date_range(2,'2026-01-15', '2026-03-01');

DELIMITER $$

CREATE PROCEDURE insert_test_durations(IN p_seriesID INT)
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_testDateID INT;
    DECLARE v_counter INT DEFAULT 1;
    DECLARE v_typeID INT;

    DECLARE cur CURSOR FOR
        SELECT TestDateID
        FROM testDate
        WHERE SeriesID = p_seriesID
        ORDER BY Date;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO v_testDateID;
        IF done = 1 THEN
            LEAVE read_loop;
        END IF;

        -- Decide TestTypeID based on weighted counter
        IF v_counter <= 3 THEN
            SET v_typeID = 1;
        ELSEIF v_counter <= 5 THEN
            SET v_typeID = 5;
        ELSEIF v_counter <= 7 THEN
            SET v_typeID = 2;
        ELSEIF v_counter = 8 THEN
            SET v_typeID = 3;
        ELSE
            SET v_typeID = 4;
        END IF;

        -- Morning test
        INSERT INTO TestDuration (TestDateID, Type, TestTypeID)
        VALUES (v_testDateID, 'Morning', v_typeID);

        -- Evening test
        INSERT INTO TestDuration (TestDateID, Type, TestTypeID)
        VALUES (v_testDateID, 'Evening', v_typeID);

        SET v_counter = v_counter + 1;
        IF v_counter > 9 THEN
            SET v_counter = 1;
        END IF;

    END LOOP;

    CLOSE cur;
END$$

DELIMITER ;

CALL insert_test_durations(1);
CALL insert_test_durations(2);