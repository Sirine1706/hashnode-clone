const replyModels = require("../models/reply.models");

const createReply = async (req, res) => {
	const newReply = new replyModels({
		content: req.body.content,
		author: req.verifiedUser._id,
	});

	try {
		const savedReply = await newReply.save();
		await req.comment.addReply(newReply._id);

		return res.status(200).json(req.comment);
	} catch (err) {
		return res.status(500).json(err);
	}
};

const deleteReply = async (req, res) => {
	const id = req.reply._id;
	try {
		const reply = await replyModels.findByIdAndDelete(id);
		return res.status(200).json(reply);
	} catch (err) {
		return res.status(500).json(err);
	}
};
const updateReply = async (req, res) => {
	const id = req.reply._id;
	try {
		const reply = await replyModels.findByIdAndUpdate(id, req.body, {
			new: true,
		});
		return res.status(200).json(reply);
	} catch (err) {
		return res.status(500).json(err);
	}
};

module.exports.createReply = createReply;
module.exports.deleteReply = deleteReply;
module.exports.updateReply = updateReply;
