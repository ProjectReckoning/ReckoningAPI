const {
  InternalServerError,
  NotFoundError,
  BadRequestError,
} = require("../../helpers/error");
const { Pocket, PocketMember } = require("../../models");
const logger = require("../../helpers/utils/logger");
const { where, Op } = require("sequelize");
const { Transaction } = require("../../models");
const { startOfMonth, endOfMonth } = require("date-fns");

module.exports.createPocket = async (pocketData, t) => {
  try {
    const existData = await this.detailPocket({
      name: pocketData.name,
      owner_user_id: pocketData.owner_user_id,
    });

    logger.info("Checking if data exist");
    console.log("Exist Data:", existData);
    if (existData.length > 0) {
      throw new BadRequestError("Pocket already exists");
    }

    const result = await Pocket.create(pocketData, { transaction: t });
    return result;
  } catch (error) {
    console.log(error);
    throw new InternalServerError(error.message);
  }
};

module.exports.detailPocket = async (attr) => {
  try {
    const data = await Pocket.findAll({
      where: attr,
      attributes: [
        "id",
        "name",
        "type",
        "target_nominal",
        "current_balance",
        "deadline",
        "status",
        "icon_name",
        "color_hex",
        "account_number",
      ],
    });

    return data;
  } catch (error) {
    throw new InternalServerError(error.message);
  }
};

module.exports.getUserPockets = async (userId) => {
  try {
    const data = await Pocket.findAll({
      where: {
        owner_user_id: userId,
      },
    });

    if (!data || data.length === 0) {
      throw new NotFoundError("No pockets found for this user");
    }

    return data;
  } catch (error) {
    throw new InternalServerError(error.message);
  }
};

module.exports.generateUniqueAccountNumber = async () => {
  const randomDigits = () => Math.floor(100000000 + Math.random() * 900000000);
  let accountNumber;
  let isUnique = false;

  while (!isUnique) {
    accountNumber = randomDigits();
    accountNumber = accountNumber.toString();
    const existingPocket = await Pocket.findOne({
      where: { account_number: accountNumber },
    });
    if (!existingPocket) {
      isUnique = true;
    }
  }

  return accountNumber;
};

module.exports.addMemberToPocket = async ({
  pocket_id,
  user_id,
  role = "member",
  contribution_amount = 0,
}) => {
  try {
    const member = await PocketMember.create({
      pocket_id,
      user_id,
      role,
      contribution_amount,
      joined_at: new Date(),
      is_active: true,
    });
    return member;
  } catch (error) {
    throw new InternalServerError(error.message);
  }
};

module.exports.updatePocket = async (pocketId, userId, updateData) => {
  try {
    const pocket = await Pocket.findOne({
      where: { id: pocketId, owner_user_id: userId },
    });

    if (!pocket) {
      throw new Error("Pocket not found or you don't have access");
    }

    await pocket.update(updateData);

    return pocket;
  } catch (error) {
    throw error;
  }
};

module.exports.deletePocket = async (pocketId) => {
  try {
    const pocket = await Pocket.findByPk(pocketId);
    if (!pocket) {
      throw new NotFoundError("Pocket not found");
    }

    await PocketMember.destroy({ where: { pocket_id: pocketId } });
    await pocket.destroy();

    return { message: "Pocket deleted successfully" };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new InternalServerError(error.message);
  }
};

module.exports.bulkAddMembersToPocket = async (memberDataArray, t) => {
  try {
    const pocketId = memberDataArray[0]?.pocket_id;
    const userIds = memberDataArray.map((m) => m.user_id);

    // Cek siapa yang sudah jadi member di pocket ini
    const existingMembers = await PocketMember.findAll({
      where: {
        pocket_id: pocketId,
        user_id: { [Op.in]: userIds },
      },
    });

    const existingUserIds = existingMembers.map((m) => m.user_id);

    // Filter hanya yang belum ada
    const newMembers = memberDataArray.filter(
      (m) => !existingUserIds.includes(m.user_id)
    );

    if (newMembers.length === 0) {
      throw new Error("All users are already members of this pocket");
    }

    const added = await PocketMember.bulkCreate(newMembers, {
      validate: true,
      transaction: t,
    });

    return {
      message: "Members added successfully",
      members: added,
      skipped: existingMembers,
    };
  } catch (error) {
    throw new InternalServerError(error.message);
  }
};


module.exports.validateNoSelfAsMember = (membersFromRequest, userId) => {
  const isIncluded = membersFromRequest.some(
    (member) => member.user_id === userId
  );
  if (isIncluded) {
    throw new BadRequestError(
      "Authenticated user cannot be included as a member"
    );
    // throw new ConflictError("Authenticated user cannot be included as a member");
  }
};

module.exports.getPocketHistory = async (pocketId, month) => {
  try {
    const startDate = startOfMonth(new Date(month));
    const endDate = endOfMonth(new Date(month));

    const history = await Transaction.findAll({
      where: {
        pocket_id: pocketId,
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [["created_at", "DESC"]],
    });

    const groupedHistory = {};

    const incomingTypes = ["Contribution", "AutoTopUp", "AutoRecurring"];
    // const outgoingTypes = ["Withdrawal", "Payment"]; // not used actually

    history.forEach((tx) => {
      const dateKey = tx.created_at.toISOString().split("T")[0];

      const isIncoming = incomingTypes.includes(tx.type);
      const transactionType = isIncoming ? 1 : 0;

      const mappedTx = {
        id: tx.id,
        type: tx.type,
        transaction_type: transactionType,
        amount: tx.amount,
        description: tx.description,
        is_business_expense: tx.is_business_expense,
      };

      if (!groupedHistory[dateKey]) {
        groupedHistory[dateKey] = [];
      }
      groupedHistory[dateKey].push(mappedTx);
    });

    const result = Object.keys(groupedHistory)
      .sort((a, b) => new Date(b) - new Date(a))
      .map((date) => ({
        date,
        transactions: groupedHistory[date],
      }));

    return result;
  } catch (error) {
    logger.error(error.message);
    throw new InternalServerError(error.message);
  }
};