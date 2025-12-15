const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Admin authentication
router.post('/login', adminController.login);

// Get all data
router.get('/students', adminController.getAllStudents);
router.get('/tests', adminController.getAllStudentTests);
router.get('/durations', adminController.getAllTestDurations);
router.get('/statistics', adminController.getStatistics);

// Student details
router.get('/students/:studentId', adminController.getStudentDetails);

// Delete operations
router.delete('/tests/:testId', adminController.deleteStudentTest);

module.exports = router;