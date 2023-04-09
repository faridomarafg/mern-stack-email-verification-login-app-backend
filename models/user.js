const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
	name: { type: String, required: true },
	email: { type: String, required: true },
	password: { type: String, required: true },
	verified: { type: Boolean, default: false },

});

//Hash password
userSchema.pre('save', async function(next){
	if(!this.isModified('password')){
		return next();
	}

	const hashedPwd = await bcrypt.hash(this.password, 10);
	this.password = hashedPwd;
	next();
});

//Generate token for user
userSchema.methods.generateAuthToken = function () {
	const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
		expiresIn: "1d",
	});
	return token;
};

module.exports = mongoose.model('User', userSchema);
