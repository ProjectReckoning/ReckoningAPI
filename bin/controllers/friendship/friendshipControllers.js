const wrapper = require("../../helpers/utils/wrapper");
const friendshipModules = require("../../modules/friendhsip/friendshipModules");
const logger = require("../../helpers/utils/logger");
const { sequelize } = require("../../models");

module.exports.sendFriendshipRequest = async (req, res) => {
    const senderUserId = req.userData.id;
    const { user_ids: targetUserIds } = req.body;

    try {
        const result = await friendshipModules.sendBulkFriendshipRequest(
        senderUserId,
        targetUserIds
        );

        logger.info("Friendship requests sent successfully");

        return res.status(201).send(
        wrapper.response(res, "success", result, "Friendship requests sent successfully")
        );
    } catch (error) {
        logger.error(`Error sending friendship requests: ${error.message}`);

        return res.status(error.code || 500).send(
        wrapper.response(
            res,
            "fail",
            wrapper.error(error),
            error.message,
            error.code || 500
        )
        );
    }
}

module.exports.handleFriendshipRequest = async (req, res) => {
    const receiverUserId = req.userData.id;
    const { requestId } = req.params;
    const action  = req.body.action; 

    try {
        const result = await friendshipModules.handleFriendshipAction(
        requestId,
        receiverUserId,
        action
        );

        logger.info(`Friendship request ${action}ed`);
        return wrapper.response(
        res,
        "success",
        wrapper.data(result),
        `Friendship request ${action}ed`,
        200
        );
    } catch (error) {
        logger.error(`Error when trying to ${action} friendship request`, error);
        return wrapper.response(
        res,
        "fail",
        wrapper.error(error),
        error.message,
        error.code || 500
        );
    }
}


module.exports.getAllFriendshipRequests = async (req,res) => {
    const userId = req.userData.id;
    try {
        const requests = await friendshipModules.getAllFriendshipRequests(userId);
        logger.info("Friendship requests fetched successfully");
        return wrapper.response(
            res,
            "success",
            wrapper.data(requests),
            "Friendship requests fetched successfully",
            200
        );
    } catch (error) {
        logger.error("Error fetching friendship requests", error);
        return wrapper.response(
            res,
            "fail",
            wrapper.error(error),
            `Error fetching friendship requests. Error: ${error.message}`,
            error.code || 500
        );
    }
}

module.exports.getFriendship = async (req, res) => {
    const userId = req.userData.id;

    try {
        const friendship = await friendshipModules.getFriendship(userId);
        logger.info("Friendship details fetched successfully");
        return wrapper.response(
            res,
            "success",
            wrapper.data(friendship),
            "Friendship details fetched successfully",
            200
        );
    } catch (error) {
        logger.error("Error fetching friendship details", error);
        return wrapper.response(
            res,
            "fail",
            wrapper.error(error),
            `Error fetching friendship details. Error: ${error.message}`,
            error.code || 500
        );
    }
}

module.exports.deleteFriendship = async (req,res) => {
    const { requestId } = req.params;
    const userId = req.userData.id;

    try {
        const result = await friendshipModules.deleteFriendship(requestId, userId);
        logger.info("Friendship deleted successfully");
        return wrapper.response(
            res,
            "success",
            wrapper.data(result),
            "Friendship deleted successfully",
            200
        );
    } catch (error) {
        logger.error("Error deleting friendship", error);
        return wrapper.response(
            res,
            "fail",
            wrapper.error(error),
            `Error deleting friendship. Error: ${error.message}`,
            error.code || 500
        );
    }
}

module.exports.cancelFriendshipRequest = async (req, res) => {
    const { requestId } = req.params;
    const senderUserId = req.userData.id;

    try {
        const result = await friendshipModules.cancelFriendshipRequest(requestId, senderUserId);
        logger.info("Friendship request cancelled successfully");
        return wrapper.response(
            res,
            "success",
            wrapper.data(result),
            "Friendship request cancelled successfully",
            200
        );
    } catch (error) {
        logger.error("Error cancelling friendship request", error);
        return wrapper.response(
            res,
            "fail",
            wrapper.error(error),
            `Error cancelling friendship request. Error: ${error.message}`,
            error.code || 500
        );
    }
}