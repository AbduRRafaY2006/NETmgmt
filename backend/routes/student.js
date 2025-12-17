const express = require('express');
const router = express.Router();
const multer = require('multer');
const studentController = require('../controllers/studentController');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2097152 // 2MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Get reference data
router.get('/backgrounds', studentController.getBackgrounds);
router.get('/test-types', studentController.getTestTypes);
router.get('/series', studentController.getSeries);

// Get eligible test types
router.get('/eligible-tests/:backgroundId', studentController.getEligibleTestTypes);

// Get available durations
router.get('/durations/:seriesId/:testTypeId', studentController.getAvailableDurations);

// Get cities for series
router.get('/series/:seriesId/cities', studentController.getSeriesCities);

// Student operations
router.post('/register', studentController.registerStudent);
router.get('/student/:cnic', studentController.getStudentByCnic);
router.get('/my-tests/:studentId', studentController.getMyTests);

// Photo upload routes
router.post('/upload-photo', upload.single('photo'), studentController.uploadPhoto);
router.get('/photo/:studentId', studentController.getStudentPhoto);

// Enrollment and application
router.post('/enroll', studentController.enrollInSeries);
router.post('/apply', studentController.applyForTest);

module.exports = router;