
const commentModel = require("../models/comment.models");
const replyModel = require("../models/reply.models");
const router = require("express").Router();
 const {
	createReply,
	deleteReply,
	updateReply,
 } = require("../controllers/reply.controllers");
router.param("comment", async (req, res, next, id) => {
	try {
		const comment = await commentModel.findById(id);

		if (!comment) {
			return res.status(404).json("comment not found");
		}
		req.comment = comment;
		next();
	} catch (err) {
		return res.status(500).json(err);
	}
});
router.param("reply", async (req, res, next, id) => {
	try {
		const reply = await replyModel.findById(id);

		if (!reply) {
			return res.status(404).json("reply not found");
		}
		req.reply = reply;
		next();
	} catch (err) {
		return res.status(500).json(err);
	}
});
router.post("/:comment/replies", createReply);
router.delete("/:comment/replies/:reply", deleteReply);
router.put("/:comment/replies/:reply", updateReply);
module.exports = router;
