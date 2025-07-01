const {
  InternalServerError,
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} = require("../../helpers/error");
const { MockSavingsAccount, Friendship, User, sequelize } = require("../../models");
const logger = require("../../helpers/utils/logger");
const { where, Op } = require("sequelize");

module.exports.sendBulkFriendshipRequest = async (
  senderUserId,
  targetUserIds
) => {
  try {
    if (!Array.isArray(targetUserIds) || targetUserIds.length === 0) {
      throw new BadRequestError("Target user IDs must be a non-empty array");
    }

    // Filter: Tidak boleh kirim ke diri sendiri
    const cleanedTargetIds = targetUserIds.filter((id) => id !== senderUserId);

    if (cleanedTargetIds.length === 0) {
      throw new BadRequestError("Cannot send requests to yourself");
    }

    // Ambil user yang valid
    const validUsers = await User.findAll({
      where: {
        id: {
          [Op.in]: cleanedTargetIds,
        },
      },
    });

    const validUserIds = validUsers.map((u) => u.id);

    if (validUserIds.length === 0) {
      throw new NotFoundError("None of the target users exist");
    }

    // Cari existing friendship (pending/accepted)
    const existingFriendships = await Friendship.findAll({
      where: {
        [Op.or]: validUserIds.map((targetId) => ({
          [Op.or]: [
            { user_id_1: senderUserId, user_id_2: targetId },
            { user_id_1: targetId, user_id_2: senderUserId },
          ],
        })),
      },
    });

    const alreadyRequestedIds = new Set(
      existingFriendships.map((f) =>
        f.user_id_1 === senderUserId ? f.user_id_2 : f.user_id_1
      )
    );

    // Filter yang belum pernah ada relasinya
    const newRequests = validUserIds
      .filter((id) => !alreadyRequestedIds.has(id))
      .map((targetId) => ({
        user_id_1: senderUserId,
        user_id_2: targetId,
        status: "pending",
        requested_at: new Date(),
      }));

    if (newRequests.length === 0) {
      throw new BadRequestError(
        "All selected users already have friendship status with you"
      );
    }

    // Simpan ke database
    const created = await Friendship.bulkCreate(newRequests);

    return {
      message: "Friendship requests sent",
      created,
      skipped: Array.from(alreadyRequestedIds),
    };
  } catch (error) {
    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      throw error;
    }
    throw new InternalServerError(error.message);
  }
};

module.exports.addFriends = async (userData, phone_numbers) => {
  const t = await sequelize.transaction();
  try {
    if (!Array.isArray(phone_numbers) || phone_numbers.length === 0) {
      throw new BadRequestError("Target user phone numbers must be a non-empty array");
    }

    const user = await User.findByPk(userData.id);
    if (!user) {
      throw new NotFoundError("Requesting user not found");
    }

    // Find all users with the given phone numbers
    const targetUsers = await User.findAll({
      where: {
        phone_number: { [Op.in]: phone_numbers },
      },
      raw: true,
    });

    if (targetUsers.length === 0) {
      throw new NotFoundError("None of the phone numbers exist in the system");
    }

    const targetPhoneToUser = new Map(
      targetUsers.map(user => [user.phone_number, user])
    );

    const validPhoneNumbers = phone_numbers.filter(phone => targetPhoneToUser.has(phone));
    const targetUserIds = validPhoneNumbers.map(phone => targetPhoneToUser.get(phone).id);

    // Check for existing friendships
    const existingFriendships = await Friendship.findAll({
      where: {
        [Op.or]: targetUserIds.flatMap(friendId => ([
          { user_id_1: user.id, user_id_2: friendId },
          { user_id_1: friendId, user_id_2: user.id },
        ])),
      },
      raw: true,
    });

    const alreadyFriendIds = new Set(
      existingFriendships.map(f =>
        f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1
      )
    );

    const newFriends = targetUsers.filter(friend => !alreadyFriendIds.has(friend.id));

    for (const friend of newFriends) {
      await Friendship.create({
        status: 'accepted',
        user_id_1: Number(user.id),
        user_id_2: Number(friend.id),
        accepted_at: new Date(),
      }, { transaction: t });
    }

    await t.commit();

    return {
      added: newFriends.map(f => f.phone_number),
      skipped: validPhoneNumbers.filter(pn => !newFriends.some(f => f.phone_number === pn)),
    };
  } catch (error) {
    await t.rollback();
    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      throw error;
    }
    throw new InternalServerError(error.message);
  }
};

module.exports.handleFriendshipAction = async (
  requestId,
  receiverUserId,
  action
) => {
  try {
    const request = await Friendship.findOne({ where: { id: requestId } });

    if (!request) {
      throw new NotFoundError("Friendship request not found");
    }

    if (request.user_id_2 !== receiverUserId) {
      throw new ForbiddenError("You are not authorized to perform this action");
    }

    normalizedAction = action.toLowerCase();

    if (normalizedAction === "accept") {
      if (request.status === "accepted") {
        throw new ForbiddenError("Friendship already accepted");
      }

      request.status = "accepted";
      request.accepted_at = new Date();
      await request.save();

      return {
        message: "Friendship request accepted",
        request,
      };
    }

    if (normalizedAction === "reject") {
      await request.destroy();
      return {
        message: "Friendship request rejected and deleted",
      };
    }

    throw new ForbiddenError("Unknown action");
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new InternalServerError(error.message);
  }
};

module.exports.getAllFriendshipRequests = async (userId) => {
  try {
    const friendships = await Friendship.findAll({
      where: {
        [Op.or]: [
          { user_id_1: userId, status: "pending" },
          { user_id_2: userId, status: "pending" },
        ],
      },
    });

    if (friendships.length === 0) {
      throw new NotFoundError("No friendship requests found");
    }

    // Pisahkan jadi dua kategori
    const sentRequests = [];
    const receivedRequests = [];

    friendships.forEach((friendship) => {
      const requestData = {
        id: friendship.id,
        user_id_1: friendship.user_id_1,
        user_id_2: friendship.user_id_2,
        status: friendship.status,
        requested_at: friendship.requested_at,
        accepted_at: friendship.accepted_at,
      };

      if (friendship.user_id_1 === userId) {
        sentRequests.push(requestData); // kamu yang ngirim
      } else {
        receivedRequests.push(requestData); // kamu yang nerima
      }
    });

    return {
      sent: sentRequests,
      received: receivedRequests,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new InternalServerError(error.message);
  }
};

module.exports.getFriendship = async (userId) => {
  try {
    const friendships = await Friendship.findAll({
      where: {
        [Op.or]: [
          { user_id_1: userId },
          { user_id_2: userId },
        ],
      },
      include: [
        {
          model: User,
          as: "user1",
          attributes: ["id", "name", "phone_number"],
          include: [
            {
              model: MockSavingsAccount,
              as: "savingAccount",
              attributes: ["account_number"],
            },
          ],
        },
        {
          model: User,
          as: "user2",
          attributes: ["id", "name", "phone_number"],
          include: [
            {
              model: MockSavingsAccount,
              as: "savingAccount",
              attributes: ["account_number"],
            },
          ],
        },
      ],
    });

    if (friendships.length === 0) {
      throw new NotFoundError("No friendships found");
    }

    const friends = friendships.map(friendship => {
      const isUser1 = friendship.user_id_1 === userId;
      const friendUser = isUser1 ? friendship.user2 : friendship.user1;

      return {
        id: friendUser.id,
        name: friendUser.name,
        phone_number: friendUser.phone_number,
        account_number: friendUser.savingAccount[0]?.account_number || null,
        status: friendship.status,
        accepted_at: friendship.accepted_at,
      };
    });

    return friends;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new InternalServerError(error.message);
  }
};




module.exports.deleteFriendship = async (requestId, userId) => {
    try {
        const friendship = await Friendship.findOne({
        where: {
            id: requestId,
            [Op.or]: [
            { user_id_1: userId },
            { user_id_2: userId },
            ],
        },
        });
    
        if (!friendship) {
        throw new NotFoundError("Friendship not found or you do not have access to it");
        }
    
        await friendship.destroy();
        return { message: "Friendship deleted successfully" };
    } catch (error) {
        if (error instanceof NotFoundError) {
        throw error;
        }
        throw new InternalServerError(error.message);
    }
}

module.exports.cancelFriendshipRequest = async (requestId, senderUserId) => {
    try {
      const friendship = await Friendship.findOne({
        where: {
          id: requestId,
          user_id_1: senderUserId,
          status: "pending"
        },
      });
  
      if (!friendship) {
        throw new NotFoundError("Request not found or already accepted/rejected");
      }
  
      await friendship.destroy();
      return { message: "Friendship request cancelled" };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new InternalServerError(error.message);
    }
  };
  