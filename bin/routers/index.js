const express = require('express');
const userRoutes = require('./userRoutes');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the ReckoningAPI!' });
});


// User Routing
router.use('/user', userRoutes);

module.exports = router;