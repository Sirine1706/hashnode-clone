const blogModels = require("../models/blog.models");
const mongoose = require("mongoose");
module.exports = function (blogId, verifiedUser) {
	return blogModels.aggregate([
		{
			$match: { _id: mongoose.Types.ObjectId(blogId) },
		},
		{
			$lookup: {
				from: "users",
				localField: "owners",
				foreignField: "_id",
				as: "owners",
			},
		},
		{
			$unwind: "$owners",
		},
		{
			$project: {
				"owners.password": 0,
			},
		},
		{
			$lookup: {
				from: "follows",
				let: {
					blogId: "$_id",
				},
				pipeline: [
					{
						$match: {
							$expr: {
								$and: {
									$eq: ["$follower", mongoose.Types.ObjectId(verifiedUser._id)],
									$eq: ["$$blogId", "$following.entity"],
									$eq: ["$following.model", "Blog"],
								},
							},
						},
					},
				],

				as: "followers",
			},
		},
		{
			$addFields: {
				followers: { $size: "$followers" },
			},
		},
		{
			$addFields: {
				canFollow: {
					$switch: {
						branches: [
							{ case: { $eq: ["$followers", 1] }, then: false },
							{ case: { $eq: ["$followers", 0] }, then: true },
						],
					},
				},
			},
		},
		{
			$unset: "followers",
		},
	]);
};
