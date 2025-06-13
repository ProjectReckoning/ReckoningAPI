const express = require('express');
const userRoutes = require('./userRoutes');
const pocketRoutes = require('./pocketRoutes');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the ReckoningAPI!' });
});


// User Routing
router.use('/user', userRoutes);

// Pocket Routing
router.use('/pocket', pocketRoutes);

module.exports = router;