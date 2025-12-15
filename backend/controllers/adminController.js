const db = require('../db');

// Admin login (simple - you can enhance with proper auth)
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        // Simple hardcoded admin (in production, use proper authentication)
        if (username === 'admin' && password === 'admin123') {
            res.json({ success: true, message: 'Login successful' });
        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all student tests with details
exports.getAllStudentTests = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                st.StudentTestID,
                s.StudentID,
                CONCAT(s.firstName, ' ', IFNULL(s.midName, ''), ' ', s.lastName) as fullName,
                s.cnic,
                s.maritalStatus,
                b.Name as background,
                tt.Name as testType,
                td.Type as timeSlot,
                tdate.Date as testDate,
                ns.TimeWindow as series
            FROM StudentTest st
            JOIN Student s ON st.StudentID = s.StudentID
            JOIN Background b ON s.BackgroundID = b.BackgroundID
            JOIN TestType tt ON st.TestTypeID = tt.TestTypeID
            JOIN TestDuration td ON st.DurationID = td.DurationID
            JOIN TestDate tdate ON td.TestDateID = tdate.TestDateID
            JOIN NetSeries ns ON tdate.SeriesID = ns.SeriesID
            ORDER BY st.StudentTestID DESC
        `);
        res.json({ success: true, tests: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all students
exports.getAllStudents = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                s.*,
                b.Name as backgroundName,
                GROUP_CONCAT(DISTINCT ns.TimeWindow) as enrolledSeries
            FROM Student s
            LEFT JOIN Background b ON s.BackgroundID = b.BackgroundID
            LEFT JOIN Enrollment e ON s.StudentID = e.StudentID
            LEFT JOIN NetSeries ns ON e.SeriesID = ns.SeriesID
            GROUP BY s.StudentID
            ORDER BY s.StudentID DESC
        `);
        res.json({ success: true, students: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get statistics
exports.getStatistics = async (req, res) => {
    try {
        const [totalStudents] = await db.query('SELECT COUNT(*) as count FROM Student');
        const [totalTests] = await db.query('SELECT COUNT(*) as count FROM StudentTest');
        const [totalSeries] = await db.query('SELECT COUNT(*) as count FROM NetSeries');
        const [byBackground] = await db.query(`
            SELECT b.Name, COUNT(s.StudentID) as count
            FROM Background b
            LEFT JOIN Student s ON b.BackgroundID = s.BackgroundID
            GROUP BY b.BackgroundID, b.Name
        `);
        const [byTestType] = await db.query(`
            SELECT tt.Name, COUNT(st.StudentTestID) as count
            FROM TestType tt
            LEFT JOIN StudentTest st ON tt.TestTypeID = st.TestTypeID
            GROUP BY tt.TestTypeID, tt.Name
        `);
        
        res.json({
            success: true,
            stats: {
                totalStudents: totalStudents[0].count,
                totalTests: totalTests[0].count,
                totalSeries: totalSeries[0].count,
                byBackground,
                byTestType
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all test durations with details
exports.getAllTestDurations = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                td.DurationID,
                td.Type,
                tt.Name as testType,
                tdate.Date,
                ns.TimeWindow as series,
                sl.City
            FROM TestDuration td
            JOIN TestType tt ON td.TestTypeID = tt.TestTypeID
            JOIN TestDate tdate ON td.TestDateID = tdate.TestDateID
            JOIN NetSeries ns ON tdate.SeriesID = ns.SeriesID
            LEFT JOIN SeriesLocation sl ON ns.SeriesID = sl.SeriesID
            ORDER BY tdate.Date, td.Type
        `);
        res.json({ success: true, durations: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get student details with all info
exports.getStudentDetails = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        // Get student basic info
        const [student] = await db.query(`
            SELECT s.*, b.Name as backgroundName
            FROM Student s
            LEFT JOIN Background b ON s.BackgroundID = b.BackgroundID
            WHERE s.StudentID = ?
        `, [studentId]);
        
        if (student.length === 0) {
            return res.json({ success: false, message: 'Student not found' });
        }
        
        // Get parents info
        const [parents] = await db.query(`
            SELECT * FROM Parent WHERE StudentID = ?
        `, [studentId]);
        
        // Get enrolled series
        const [enrollments] = await db.query(`
            SELECT ns.* FROM Enrollment e
            JOIN NetSeries ns ON e.SeriesID = ns.SeriesID
            WHERE e.StudentID = ?
        `, [studentId]);
        
        // Get tests
        const [tests] = await db.query(`
            SELECT 
                st.*,
                tt.Name as testType,
                td.Type as timeSlot,
                tdate.Date as testDate
            FROM StudentTest st
            JOIN TestType tt ON st.TestTypeID = tt.TestTypeID
            JOIN TestDuration td ON st.DurationID = td.DurationID
            JOIN TestDate tdate ON td.TestDateID = tdate.TestDateID
            WHERE st.StudentID = ?
        `, [studentId]);
        
        res.json({
            success: true,
            student: student[0],
            parents,
            enrollments,
            tests
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete student test
exports.deleteStudentTest = async (req, res) => {
    try {
        const { testId } = req.params;
        await db.query('DELETE FROM StudentTest WHERE StudentTestID = ?', [testId]);
        res.json({ success: true, message: 'Test deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};