const express = require("express");
const pocketController = require("../controllers/pocket/pocketControllers");
const userAuth = require("../middlewares/userAuth");

const router = express.Router();

// Route create pocket
router.post("/create", pocketController.createPocket);

// Route get all pockets
router.get("/", userAuth.authenticateToken, pocketController.getUserPocket);

module.exports = router;
