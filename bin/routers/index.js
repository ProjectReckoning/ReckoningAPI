const express = require('express');
const exampleRoutes = require('./exampleRoutes');
const userRoutes = require('./userRoutes');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the ReckoningAPI!' });
});

// Other Routing
router.use('/example', exampleRoutes);

// User Routing
router.use('/user', userRoutes);

module.exports = router;