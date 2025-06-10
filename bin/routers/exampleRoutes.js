const router = require('express').Router();

const exampleController = require('../controllers/exampleControllers.js');
const validateProduct = require('../middlewares/validateProduct.js');

router.post(
  '/',
  validateProduct,
  exampleController.createProduct
);
router.get('/',
  exampleController.getAllProduct
);
router.get('/:name',
  exampleController.getDetailProduct
);
router.put('/:name',
  validateProduct,
  exampleController.updateProduct
);
router.delete('/:id',
  exampleController.deleteProduct
);

module.exports = router;