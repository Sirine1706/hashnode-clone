const userModels = require("../models/user.models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const isEmail = require("validator/lib/isEmail");
const { emailQueue } = require("../queues");
const { REGISTER_ASYNC_USER } = require("../constants");
const crypto = require("crypto");
const transporter = require("../utils/nodemailer");
const Redis = require("ioredis");
const redisIO = new Redis({
	port: process.env.REDIS_PORT,
	host: process.env.REDIS_HOST,
	username: process.env.REDIS_NAME,
	password: process.env.REDIS_PASSWORD,
});
const register = async (req, res) => {
	try {
		const existEmail = await userModels.findOne({ email: req.body.email });

		if (existEmail) {
			return res.status(422).json("Email already exist");
		}
		emailQueue.add(REGISTER_ASYNC_USER, req.body);
		return res.status(202).json("account successfully created");
	} catch (err) {
		return res.status(500).json(err);
	}
};

const login = async (req, res) => {
	let existUser = null;
	try {
		if (isEmail(req.body.loginInfo)) {
			existUser = await userModels.findOne({ email: req.body.loginInfo });
		} else {
			existUser = await userModels.findOne({ username: req.body.loginInfo });
		}

		if (!existUser) {
			return res.status(401).json("Wrong Email/Password");
		}

		const validPassword = await bcrypt.compare(
			req.body.password,
			existUser.password
		);

		if (!validPassword) {
			return res.status(401).json("Wrong Email/Password");
		}
		const token = jwt.sign(
			{
				_id: existUser._id,
				email: existUser.email,
				username: existUser.username,
				isAdmin: existUser.isAdmin,
				isEmailVerified: existUser.isEmailVerified,
			},
			process.env.TOKEN_KEY,
			{ expiresIn: "2 days" }
		);
		redisIO.set(token, existUser._id, "ex", 3600 * 48);
		existUser.lastLogin = Date.now();
		await existUser.save();
		return res.status(200).json({ user: existUser, token: token });
	} catch (err) {
		return res.status(500).json(err);
	}
};

const emailVerification = async (req, res) => {
	if (!req.query.token) {
		return res.status(400).json("invalid token");
	}
	try {
		const verifiedEmail = jwt.verify(
			req.query.token,
			process.env.EMAIL_TOKEN_KEY
		);
		const user = await userModels.findByIdAndUpdate(
			verifiedEmail._id,
			{ isEmailVerified: true },
			{ new: true }
		);
		return res.status(200).json(user);
	} catch (err) {
		return res.status(400).json("token not valid");
	}
};
const resetPassword = async (req, res) => {
	if (!req.body.code) {
		return res.status(400).json("invalid token");
	}
	const email = await redisIO.get(req.body.code);
	if (!email) {
		return res.status(400).json("request a new code, your is invalid");
	}
	try {
		const salt = await bcrypt.genSalt(16);
		const hashedPassword = await bcrypt.hash(req.body.password, salt);

		const user = await userModels.findOneAndUpdate(
			{ email: email },
			{ password: hashedPassword },
			{ new: true }
		);
		return res.status(200).json(user);
	} catch (err) {
		return res.status(500).json(err);
	}
};
const forgotPassword = async (req, res) => {
	try {
		const existUser = await userModels.findOne({ email: req.body.email });

		if (!existUser) {
			return res
				.status(202)
				.json("If your email exist in db you will get a reset password link");
		}
		const code = crypto
			.randomBytes(Math.ceil(6 / 2))
			.toString("hex") // convert to hexadecimal format
			.slice(0, 6)
			.toUpperCase();

		redisIO.set(code, existUser.email, "ex", 3600);

		emailQueue.add(SEND_FORGOT_PASSWORD_EMAIL, {
			from: "clone@hashnode.com",
			to: existUser.email,
			subject: "reset password ✔",
			text: "Hello world?",
			html: `this is your code: ${code}`,
		});
		return res
			.status(202)
			.json("If your email exist in db you will get a reset password link");
	} catch (err) {
		return res.status(500).json(err);
	}
};
module.exports.forgotPassword = forgotPassword;
module.exports.emailVerification = emailVerification;
module.exports.register = register;
module.exports.login = login;
module.exports.resetPassword = resetPassword;
