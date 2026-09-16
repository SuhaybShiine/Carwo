const express = require('express');
const router = express.Router();
const fabricController = require('../controllers/fabricController');

// Stock
router.get('/stock', fabricController.getAllStock);
router.put('/stock/:id', fabricController.updateStock);

// Formulas
router.get('/formulas', fabricController.getAllFormulas);
router.get('/item-types', fabricController.getItemTypes);
router.post('/formulas', fabricController.createFormula);
router.put('/formulas/:id', fabricController.updateFormula);
router.delete('/formulas/:id', fabricController.deleteFormula);

// Calculate
router.post('/calculate', fabricController.calculateWaar);

module.exports = router;