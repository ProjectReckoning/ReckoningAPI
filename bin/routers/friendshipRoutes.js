const express = require("express");
const friendshipController = require("../controllers/friendship/friendshipControllers");
const userAuth = require("../middlewares/userAuth");

const router = express.Router();

// Route to get all friends of the authenticated user
router.get(
    "/",
    userAuth.authenticateToken,
    friendshipController.getFriendship
);

// Route to send a friendship request
router.post(
  "/request",
  userAuth.authenticateToken,
  friendshipController.sendFriendshipRequest
);

// Route to handle friendship request actions (accept/reject)
// e.g. /friendship/123?action=accept 
// "JANGAN LUPA KASIH ACTION (PARAM QUERY) ACCEPT ATAU REJECT"
router.patch(
  "/request/:requestId",
  userAuth.authenticateToken,
  friendshipController.handleFriendshipRequest
);

router.delete(
    "/request/:requestId",
    userAuth.authenticateToken,
    friendshipController.cancelFriendshipRequest
)

// Route to get all friendship requests for the authenticated user
router.get(
  "/request",
  userAuth.authenticateToken,
  friendshipController.getAllFriendshipRequests
);

router.delete(
  "/request/:requestId",
  userAuth.authenticateToken,
  friendshipController.deleteFriendship
);

module.exports = router;