const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

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

// Enrollment and application
router.post('/enroll', studentController.enrollInSeries);
router.post('/apply', studentController.applyForTest);

module.exports = router;