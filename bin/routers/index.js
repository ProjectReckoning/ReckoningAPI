const express = require('express');
const exampleRoutes = require('./exampleRoutes');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the ReckoningAPI!' });
});

// Other Routing
router.use('/example', exampleRoutes);

module.exports = router;