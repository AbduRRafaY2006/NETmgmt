const db = require('../db');

// Get all backgrounds
exports.getBackgrounds = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Background');
        res.json({ success: true, backgrounds: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all test types
exports.getTestTypes = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM TestType');
        res.json({ success: true, testTypes: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all series
exports.getSeries = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM NetSeries');
        res.json({ success: true, series: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get eligible test types for a background
exports.getEligibleTestTypes = async (req, res) => {
    try {
        const { backgroundId } = req.params;
        const [rows] = await db.query(`
            SELECT tt.*
            FROM TestType tt
            JOIN EligibilityRule er ON tt.TestTypeID = er.TestTypeID
            WHERE er.BackgroundID = ?
        `, [backgroundId]);
        res.json({ success: true, testTypes: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get available test durations for a series and test type
exports.getAvailableDurations = async (req, res) => {
    try {
        const { seriesId, testTypeId } = req.params;
        const [rows] = await db.query(`
            SELECT 
                td.DurationID,
                td.Type,
                tdate.Date,
                tt.Name as testType,
                ns.TimeWindow,
                sl.City
            FROM TestDuration td
            JOIN TestDate tdate ON td.TestDateID = tdate.TestDateID
            JOIN TestType tt ON td.TestTypeID = tt.TestTypeID
            JOIN NetSeries ns ON tdate.SeriesID = ns.SeriesID
            LEFT JOIN SeriesLocation sl ON ns.SeriesID = sl.SeriesID
            WHERE tdate.SeriesID = ? AND td.TestTypeID = ?
            AND tdate.Date >= CURDATE()
            ORDER BY tdate.Date, td.Type
        `, [seriesId, testTypeId]);
        res.json({ success: true, durations: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Register new student
exports.registerStudent = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const { 
            cnic, firstName, midName, lastName, maritalStatus, 
            address, backgroundId, 
            fatherName, fatherCnic, fatherOccupation, fatherStatus,
            motherName, motherCnic, motherOccupation, motherStatus
        } = req.body;
        
        // Insert student
        const [studentResult] = await connection.query(`
            INSERT INTO Student (cnic, firstName, midName, lastName, maritalStatus, address, BackgroundID)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [cnic, firstName, midName, lastName, maritalStatus, address, backgroundId]);
        
        const studentId = studentResult.insertId;
        
        // Insert father info
        if (fatherName && fatherCnic) {
            await connection.query(`
                INSERT INTO Parent (StudentID, parentType, parentName, cnic, occupation, status)
                VALUES (?, 'Father', ?, ?, ?, ?)
            `, [studentId, fatherName, fatherCnic, fatherOccupation, fatherStatus]);
        }
        
        // Insert mother info
        if (motherName && motherCnic) {
            await connection.query(`
                INSERT INTO Parent (StudentID, parentType, parentName, cnic, occupation, status)
                VALUES (?, 'Mother', ?, ?, ?, ?)
            `, [studentId, motherName, motherCnic, motherOccupation, motherStatus]);
        }
        
        await connection.commit();
        res.json({ success: true, message: 'Student registered successfully', studentId });
        
    } catch (error) {
        await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            res.json({ success: false, message: 'CNIC already exists' });
        } else if (error.sqlState === '45000') {
            res.json({ success: false, message: error.sqlMessage });
        } else {
            res.status(500).json({ success: false, message: error.message });
        }
    } finally {
        connection.release();
    }
};
exports.uploadPhoto = async (req, res) => {
    try {
        const { studentId } = req.body;
        
        if (!req.file) {
            return res.json({ success: false, message: 'No photo uploaded' });
        }

        // Check file size (2MB limit as per schema)
        if (req.file.size > 2097152) {
            return res.json({ success: false, message: 'Photo size must be less than 2MB' });
        }

        // Check if photo already exists for this student
        const [existing] = await db.query(
            'SELECT photoID FROM StudentPhoto WHERE StudentID = ?',
            [studentId]
        );

        if (existing.length > 0) {
            // Update existing photo
            await db.query(
                'UPDATE StudentPhoto SET photo = ? WHERE StudentID = ?',
                [req.file.buffer, studentId]
            );
        } else {
            // Insert new photo
            await db.query(
                'INSERT INTO StudentPhoto (StudentID, photo) VALUES (?, ?)',
                [studentId, req.file.buffer]
            );
        }

        res.json({ success: true, message: 'Photo uploaded successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get student photo
exports.getStudentPhoto = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        const [rows] = await db.query(
            'SELECT photo FROM StudentPhoto WHERE StudentID = ?',
            [studentId]
        );

        if (rows.length === 0 || !rows[0].photo) {
            return res.status(404).json({ success: false, message: 'Photo not found' });
        }

        // Send image
        res.contentType('image/jpeg');
        res.send(rows[0].photo);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Enroll student in series
exports.enrollInSeries = async (req, res) => {
    try {
        const { studentId, seriesId } = req.body;
        
        // Check if already enrolled
        const [existing] = await db.query(
            'SELECT * FROM Enrollment WHERE StudentID = ? AND SeriesID = ?',
            [studentId, seriesId]
        );
        
        if (existing.length > 0) {
            return res.json({ success: false, message: 'Already enrolled in this series' });
        }
        
        await db.query(
            'INSERT INTO Enrollment (StudentID, SeriesID) VALUES (?, ?)',
            [studentId, seriesId]
        );
        
        res.json({ success: true, message: 'Enrolled successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Apply for test
exports.applyForTest = async (req, res) => {
    try {
        const { studentId, durationId, testTypeId } = req.body;
        
        // Check if student already applied for this test
        const [existing] = await db.query(
            'SELECT * FROM StudentTest WHERE StudentID = ? AND DurationID = ?',
            [studentId, durationId]
        );
        
        if (existing.length > 0) {
            return res.json({ success: false, message: 'Already applied for this test slot' });
        }
        
        // Insert student test (eligibility will be checked by trigger)
        await db.query(
            'INSERT INTO StudentTest (StudentID, DurationID, TestTypeID) VALUES (?, ?, ?)',
            [studentId, durationId, testTypeId]
        );
        
        res.json({ success: true, message: 'Test application submitted successfully' });
        
    } catch (error) {
        if (error.sqlState === '45000') {
            res.json({ success: false, message: error.sqlMessage });
        } else {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

// Get student by CNIC (for login/lookup)
exports.getStudentByCnic = async (req, res) => {
    try {
        const { cnic } = req.params;
        const [rows] = await db.query(`
            SELECT s.*, b.Name as backgroundName
            FROM Student s
            LEFT JOIN Background b ON s.BackgroundID = b.BackgroundID
            WHERE s.cnic = ?
        `, [cnic]);
        
        if (rows.length === 0) {
            return res.json({ success: false, message: 'Student not found' });
        }
        
        res.json({ success: true, student: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get student's tests
exports.getMyTests = async (req, res) => {
    try {
        const { studentId } = req.params;
        const [rows] = await db.query(`
            SELECT 
                st.*,
                tt.Name as testType,
                td.Type as timeSlot,
                tdate.Date as testDate,
                ns.TimeWindow as series
            FROM StudentTest st
            JOIN TestType tt ON st.TestTypeID = tt.TestTypeID
            JOIN TestDuration td ON st.DurationID = td.DurationID
            JOIN TestDate tdate ON td.TestDateID = tdate.TestDateID
            JOIN NetSeries ns ON tdate.SeriesID = ns.SeriesID
            WHERE st.StudentID = ?
            ORDER BY tdate.Date DESC
        `, [studentId]);
        
        res.json({ success: true, tests: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get cities for a series
exports.getSeriesCities = async (req, res) => {
    try {
        const { seriesId } = req.params;
        const [rows] = await db.query(`
            SELECT DISTINCT City FROM SeriesLocation WHERE SeriesID = ?
        `, [seriesId]);
        res.json({ success: true, cities: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

