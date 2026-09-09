const express = require('express');
const router = express.Router();
const orderStateController = require('../controllers/orderStateController');

router.get('/order/:orderId', orderStateController.getStatesByOrder);
router.get('/:id', orderStateController.getStateById);
router.post('/', orderStateController.addState);
router.put('/:id', orderStateController.updateState);
router.delete('/:id', orderStateController.deleteState);

module.exports = router;