const express = require("express");
const userRoutes = require("./userRoutes");
const pocketRoutes = require("./pocketRoutes");
const friendshipRoutes = require("./friendshipRoutes"); 
const transactionRoutes = require("./transactionRoutes"); 

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Welcome to the ReckoningAPI!" });
});

// User Routing
router.use("/user", userRoutes);

// Pocket Routing
router.use("/pocket", pocketRoutes);

// Friendship Routing
router.use("/friendship", friendshipRoutes);

// Transaction routing
router.use('/transaction', transactionRoutes);

module.exports = router;
