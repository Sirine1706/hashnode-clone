const { Queue } = require("bullmq");
const { EMAIL_QUEUE } = require("../constants/index");
module.exports.emailQueue = new Queue(EMAIL_QUEUE, {
	connection: {
		port: process.env.REDIS_PORT,
		host: process.env.REDIS_HOST,
		username: process.env.REDIS_NAME,
		password: process.env.REDIS_PASSWORD,
	},
	defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
});
