const express = require('express');
const exampleRoutes = require('./exampleRoutes');
const userRoutes = require('./userRoutes');
const pocketRoutes = require('./pocketRoutes');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the ReckoningAPI!' });
});

// Other Routing
router.use('/example', exampleRoutes);

// User Routing
router.use('/user', userRoutes);

// Pocket Routing
router.use('/pocket', pocketRoutes);

module.exports = router;