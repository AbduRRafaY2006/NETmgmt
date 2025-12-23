
USE netms;

-- 1. Background
CREATE TABLE Background (
    BackgroundID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(50) NOT NULL
);

-- 2. Student
CREATE TABLE Student (
    StudentID INT PRIMARY KEY AUTO_INCREMENT,
    cnic CHAR(15) NOT NULL UNIQUE,
    firstName VARCHAR(50) NOT NULL,
    midName VARCHAR(50),
    lastName VARCHAR(50) NOT NULL,
    maritalStatus ENUM('Married','Single','Divorced','Widowed'),
    address MEDIUMTEXT NOT NULL,
    BackgroundID INT,
    FOREIGN KEY (BackgroundID) REFERENCES Background(BackgroundID)
        ON DELETE SET NULL
);

-- 4. NetSeries
CREATE TABLE NetSeries (
    SeriesID INT PRIMARY KEY AUTO_INCREMENT,
    TimeWindow VARCHAR(100) NOT NULL
);


-- 5. SeriesLocation
CREATE TABLE SeriesLocation (
    SeriesLocationID INT PRIMARY KEY AUTO_INCREMENT,
    SeriesID INT,
    City ENUM('ISB','Karachi','Quetta','Gilgit'),
    FOREIGN KEY (SeriesID) REFERENCES NetSeries(SeriesID)
        ON DELETE CASCADE
);

-- 6. TestDate
CREATE TABLE TestDate (
    TestDateID INT PRIMARY KEY AUTO_INCREMENT,
    SeriesID INT,
    Date DATE NOT NULL,
    FOREIGN KEY (SeriesID) REFERENCES NetSeries(SeriesID)
        ON DELETE CASCADE
);

-- 7. TestDuration
CREATE TABLE TestDuration (
    DurationID INT PRIMARY KEY AUTO_INCREMENT,
    TestDateID INT,
    TestTypeID INT,
    Type ENUM('Morning','Evening'),
    FOREIGN KEY (TestDateID) REFERENCES TestDate(TestDateID)
        ON DELETE CASCADE,
	FOREIGN KEY (TestTypeID) REFERENCES TestType(TestTypeID)
        ON DELETE CASCADE
);

-- 8. TestType
CREATE TABLE TestType (
    TestTypeID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100)
);

-- 9. EligibilityRule
CREATE TABLE EligibilityRule (
    EligibilityRuleID INT PRIMARY KEY AUTO_INCREMENT,
    TestTypeID INT,
    BackgroundID INT,
    FOREIGN KEY (TestTypeID) REFERENCES TestType(TestTypeID)
        ON DELETE CASCADE,
    FOREIGN KEY (BackgroundID) REFERENCES Background(BackgroundID)
        ON DELETE CASCADE
);

-- 10. Enrollment
CREATE TABLE Enrollment (
    StudentID INT,
    SeriesID INT,
    PRIMARY KEY(StudentID,SeriesID),
    FOREIGN KEY (StudentID) REFERENCES Student(StudentID)
        ON DELETE CASCADE,
    FOREIGN KEY (SeriesID) REFERENCES NetSeries(SeriesID)
        ON DELETE CASCADE
);

-- 11. StudentTest
CREATE TABLE StudentTest (
    StudentTestID INT PRIMARY KEY AUTO_INCREMENT,
    StudentID INT,
    DurationID INT,
    TestTypeID INT,
    FOREIGN KEY (StudentID) REFERENCES Student(StudentID)
        ON DELETE CASCADE,
    FOREIGN KEY (DurationID) REFERENCES TestDuration(DurationID)
        ON DELETE CASCADE,
    FOREIGN KEY (TestTypeID) REFERENCES TestType(TestTypeID)
        ON DELETE CASCADE
);

-- 12. Parent
CREATE TABLE Parent (
    ParentID INT PRIMARY KEY AUTO_INCREMENT,
    StudentID INT,
    parentType ENUM('Mother','Father'),
    parentName VARCHAR(100) NOT NULL,
    cnic CHAR(15) UNIQUE NOT NULL,
    occupation VARCHAR(100),
    status ENUM('Alive','Deceased','Shaheed'),
    FOREIGN KEY (StudentID) REFERENCES Student(StudentID)
        ON DELETE CASCADE
);

-- 13. StudentPhoto
CREATE TABLE StudentPhoto (
    photoID INT PRIMARY KEY AUTO_INCREMENT,
    StudentID INT,
    photo LONGBLOB,
    FOREIGN KEY (StudentID) REFERENCES Student(StudentID)
        ON DELETE CASCADE,
    CONSTRAINT chk_photo_size CHECK (OCTET_LENGTH(photo) <= 2097152)
);

DELIMITER $$

CREATE TRIGGER trg_before_student_insert
BEFORE INSERT ON Student
FOR EACH ROW
BEGIN
    IF NEW.cnic NOT REGEXP '^[0-9]{5}-[0-9]{7}-[0-9]{1}$' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid CNIC format. Use 12345-1234567-1';
    END IF;
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER trg_before_parent_insert
BEFORE INSERT ON Parent
FOR EACH ROW
BEGIN
    IF NEW.cnic NOT REGEXP '^[0-9]{5}-[0-9]{7}-[0-9]{1}$' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid CNIC format. Use 12345-1234567-1';
    END IF;
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER trg_check_eligibility
BEFORE INSERT ON StudentTest
FOR EACH ROW
BEGIN
    DECLARE v_background INT;
    DECLARE cnt INT;

    -- 1️ Get the student's background
    SELECT BackgroundID INTO v_background
    FROM Student
    WHERE StudentID = NEW.StudentID;

    -- 2️ Check eligibility
    SELECT COUNT(*) INTO cnt
    FROM EligibilityRule
    WHERE BackgroundID = v_background
      AND TestTypeID = NEW.TestTypeID;

    -- 3️ Raise error if not eligible
    IF cnt = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Student is not eligible for this test type based on their background.';
    END IF;
END$$

DELIMITER ;



DROP DATABASE IF EXISTS netms;
CREATE DATABASE netms;
USE netms;

-- 1. Background
CREATE TABLE Background (
    BackgroundID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(50) NOT NULL
);

-- 2. TestType (MOVED UP - must be created before TestDuration)
CREATE TABLE TestType (
    TestTypeID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100)
);

-- 3. Student
CREATE TABLE Student (
    StudentID INT PRIMARY KEY AUTO_INCREMENT,
    cnic CHAR(15) NOT NULL UNIQUE,
    firstName VARCHAR(50) NOT NULL,
    midName VARCHAR(50),
    lastName VARCHAR(50) NOT NULL,
    maritalStatus ENUM('Married','Single','Divorced','Widowed'),
    address MEDIUMTEXT NOT NULL,
    BackgroundID INT,
    FOREIGN KEY (BackgroundID) REFERENCES Background(BackgroundID)
        ON DELETE SET NULL
);

-- 4. NetSeries
CREATE TABLE NetSeries (
    SeriesID INT PRIMARY KEY AUTO_INCREMENT,
    TimeWindow VARCHAR(100) NOT NULL
);

-- 5. SeriesLocation (FIXED - Changed ENUM to VARCHAR)
CREATE TABLE SeriesLocation (
    SeriesLocationID INT PRIMARY KEY AUTO_INCREMENT,
    SeriesID INT,
    City VARCHAR(50) NOT NULL,
    FOREIGN KEY (SeriesID) REFERENCES NetSeries(SeriesID)
        ON DELETE CASCADE
);

-- 6. TestDate
CREATE TABLE TestDate (
    TestDateID INT PRIMARY KEY AUTO_INCREMENT,
    SeriesID INT,
    Date DATE NOT NULL,
    FOREIGN KEY (SeriesID) REFERENCES NetSeries(SeriesID)
        ON DELETE CASCADE
);

-- 7. TestDuration (Now TestType exists)
CREATE TABLE TestDuration (
    DurationID INT PRIMARY KEY AUTO_INCREMENT,
    TestDateID INT,
    TestTypeID INT,
    Type ENUM('Morning','Evening'),
    FOREIGN KEY (TestDateID) REFERENCES TestDate(TestDateID)
        ON DELETE CASCADE,
    FOREIGN KEY (TestTypeID) REFERENCES TestType(TestTypeID)
        ON DELETE CASCADE
);

-- 8. EligibilityRule
CREATE TABLE EligibilityRule (
    EligibilityRuleID INT PRIMARY KEY AUTO_INCREMENT,
    TestTypeID INT,
    BackgroundID INT,
    FOREIGN KEY (TestTypeID) REFERENCES TestType(TestTypeID)
        ON DELETE CASCADE,
    FOREIGN KEY (BackgroundID) REFERENCES Background(BackgroundID)
        ON DELETE CASCADE
);

-- 9. Enrollment
CREATE TABLE Enrollment (
    StudentID INT,
    SeriesID INT,
    PRIMARY KEY(StudentID, SeriesID),
    FOREIGN KEY (StudentID) REFERENCES Student(StudentID)
        ON DELETE CASCADE,
    FOREIGN KEY (SeriesID) REFERENCES NetSeries(SeriesID)
        ON DELETE CASCADE
);

-- 10. StudentTest
CREATE TABLE StudentTest (
    StudentTestID INT PRIMARY KEY AUTO_INCREMENT,
    StudentID INT,
    DurationID INT,
    TestTypeID INT,
    FOREIGN KEY (StudentID) REFERENCES Student(StudentID)
        ON DELETE CASCADE,
    FOREIGN KEY (DurationID) REFERENCES TestDuration(DurationID)
        ON DELETE CASCADE,
    FOREIGN KEY (TestTypeID) REFERENCES TestType(TestTypeID)
        ON DELETE CASCADE
);

-- 11. Parent
CREATE TABLE Parent (
    ParentID INT PRIMARY KEY AUTO_INCREMENT,
    StudentID INT,
    parentType ENUM('Mother','Father'),
    parentName VARCHAR(100) NOT NULL,
    cnic CHAR(15) UNIQUE NOT NULL,
    occupation VARCHAR(100),
    status ENUM('Alive','Deceased','Shaheed'),
    FOREIGN KEY (StudentID) REFERENCES Student(StudentID)
        ON DELETE CASCADE
);

-- 12. StudentPhoto
CREATE TABLE StudentPhoto (
    photoID INT PRIMARY KEY AUTO_INCREMENT,
    StudentID INT UNIQUE,
    photo LONGBLOB,
    FOREIGN KEY (StudentID) REFERENCES Student(StudentID)
        ON DELETE CASCADE,
    CONSTRAINT chk_photo_size CHECK (OCTET_LENGTH(photo) <= 2097152)
);

-- TRIGGERS

DELIMITER $$

CREATE TRIGGER trg_before_student_insert
BEFORE INSERT ON Student
FOR EACH ROW
BEGIN
    IF NEW.cnic NOT REGEXP '^[0-9]{5}-[0-9]{7}-[0-9]{1}$' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid CNIC format. Use 12345-1234567-1';
    END IF;
END$$

CREATE TRIGGER trg_before_parent_insert
BEFORE INSERT ON Parent
FOR EACH ROW
BEGIN
    IF NEW.cnic NOT REGEXP '^[0-9]{5}-[0-9]{7}-[0-9]{1}$' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid CNIC format. Use 12345-1234567-1';
    END IF;
END$$

CREATE TRIGGER trg_check_eligibility
BEFORE INSERT ON StudentTest
FOR EACH ROW
BEGIN
    DECLARE v_background INT;
    DECLARE cnt INT;

    -- Get the student's background
    SELECT BackgroundID INTO v_background
    FROM Student
    WHERE StudentID = NEW.StudentID;

    -- Check eligibility
    SELECT COUNT(*) INTO cnt
    FROM EligibilityRule
    WHERE BackgroundID = v_background
      AND TestTypeID = NEW.TestTypeID;

    -- Raise error if not eligible
    IF cnt = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Student is not eligible for this test type based on their background.';
    END IF;
END$$

DELIMITER ;





