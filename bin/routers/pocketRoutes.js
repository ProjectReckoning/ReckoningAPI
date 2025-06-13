const express = require("express");
const pocketController = require("../controllers/pocket/pocketControllers");
const userAuth = require("../middlewares/userAuth");

const router = express.Router();

// Route get all pockets
router.get("/", userAuth.authenticateToken, pocketController.getUserPocket);

// Route create pocket
router.post("/", userAuth.authenticateToken, pocketController.createPocket);

// Route get pocket detail
router.get(
  "/:pocketId",
  userAuth.authenticateToken,
  pocketController.getPocketDetail
);

// Router update pocket
router.patch(
  "/:pocketId",
  userAuth.authenticateToken,
  pocketController.updatePocket
);

// Router delete pocket
router.delete(
  "/:pocketId",
  userAuth.authenticateToken,
  pocketController.deletePocket
);

module.exports = router;
