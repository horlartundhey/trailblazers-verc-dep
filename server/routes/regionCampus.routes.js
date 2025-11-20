const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const regionCampusController = require('../controllers/regionCampus.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes require Admin authentication
router.use(protect);
router.use(authorize('Admin'));

// Sync route - import existing regions/campuses from User collection
router.post('/sync', regionCampusController.syncRegionsAndCampuses);

// Region routes
router.get('/regions', regionCampusController.getRegions);
router.post(
  '/regions',
  [
    check('name', 'Region name is required').not().isEmpty().trim(),
    check('code', 'Region code is required').not().isEmpty().trim(),
    check('description').optional().trim()
  ],
  regionCampusController.createRegion
);
router.put('/regions/:id', regionCampusController.updateRegion);
router.delete('/regions/:id', regionCampusController.deleteRegion);

// Campus routes
router.get('/campuses', regionCampusController.getCampuses);
router.post(
  '/campuses',
  [
    check('name', 'Campus name is required').not().isEmpty().trim(),
    check('code', 'Campus code is required').not().isEmpty().trim(),
    check('parentRegion', 'Parent region is required').not().isEmpty(),
    check('description').optional().trim()
  ],
  regionCampusController.createCampus
);
router.put('/campuses/:id', regionCampusController.updateCampus);
router.delete('/campuses/:id', regionCampusController.deleteCampus);

module.exports = router;
