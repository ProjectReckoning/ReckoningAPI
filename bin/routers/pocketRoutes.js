const express = require("express");
const pocketController = require("../controllers/pocket/pocketControllers");
const userAuth = require("../middlewares/userAuth");
const pocketBusinessController = require("../controllers/pocket/pocketBusinessControllers");

const router = express.Router();


//// KEPERLUAN BISNIS POCKET DISINNI
router.get(
  "/business",
  userAuth.authenticateToken,
  pocketBusinessController.getBusinessPockets
)

// router.patch(
//   "/business/:pocketId/members",
//   userAuth.authenticateToken,
//   pocketBusinessController.updateBusinessPocket
// );

router.get('/business/last-5', userAuth.authenticateToken, pocketBusinessController.getAllBusinessLast5TransactionsHistory);
router.get('/business/:pocketId/last-5', userAuth.authenticateToken, pocketBusinessController.getLast5BusinessPocketHistory);
router.get('/business/:pocketId/history', userAuth.authenticateToken, pocketBusinessController.getBusinessPocketTransactionHistory);

router.get('/business/:pocketId/bep', userAuth.authenticateToken, pocketBusinessController.getBEP);

// KEPERLUAN POCKET BIASA SETELAH INI

// Route get all pockets
router.get("/", userAuth.authenticateToken, pocketController.getUserPocket);

// Route create pocket
router.post("/", userAuth.authenticateToken, pocketController.createPocket);

router.post('/respond-invite', userAuth.authenticateToken, pocketController.respondInvite);

router.post('/invite', userAuth.authenticateToken, pocketController.inviteMember);

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

// Router post member to pocket
router.post(
  "/:pocketId/members",
  userAuth.authenticateToken,
  pocketController.addMembersToPocket
);

// Router get member pocket
router.get(
  "/:pocketId/members",
  userAuth.authenticateToken,
  pocketController.getMembersOfPocket
);

// Router delete member from pocket
router.delete(
  "/:pocketId/members",
  userAuth.authenticateToken,
  pocketController.deletePocketMember
);

// Leave pocket
router.delete(
  "/:pocketId/leave",
  userAuth.authenticateToken,
  pocketController.leavePocket
);

router.patch(
  "/:pocketId/members",
  userAuth.authenticateToken,
  pocketController.updateRolePocketMember
);

router.patch(
  "/:pocketId/members/role",
  userAuth.authenticateToken,
  pocketController.updateRolePocketMember
);

// change owner of pocket
router.patch(
  "/:pocketId/members/change-owner",
  userAuth.authenticateToken,
  pocketController.changeOwnerPocket
);

// History pocket
router.get('/:pocketId/history', userAuth.authenticateToken, pocketController.getPocketHistory)

module.exports = router;
