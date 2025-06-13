const express = require("express");
const pocketController = require("../controllers/pocket/pocketControllers");
const userAuth = require("../middlewares/userAuth");

const router = express.Router();

// Route get all pockets
router.get("/", userAuth.authenticateToken, pocketController.getUserPocket);

// Route create pocket
router.post("/create", userAuth.authenticateToken, pocketController.createPocket);



module.exports = router;
