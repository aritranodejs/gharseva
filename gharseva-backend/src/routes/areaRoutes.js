const express = require('express');
const router = express.Router();
const areaController = require('../controllers/areaController');

router.get('/', areaController.getAreas);
router.post('/', areaController.addArea);
router.put('/:id', areaController.updateArea);

module.exports = router;
