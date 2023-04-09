const User = require('../models/user');
const Token = require('../models/token');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const sendEmail = require("../utils/sendEmail");
const bcrypt = require('bcrypt');

//Register user
const register = asyncHandler(async (req, res)=>{
    const {name, email, password} = req.body;
    if(!name || !email || !password) return res.status(400).json({message:'All fields are required'});

    //check for duplicate user in db
    let user = await User.findOne({email});
    if(user) return res.status(409).json({message:'Email is already exist!'});

    //create user
    user=  await new User({name, email, password}).save();
    
    //Create email-verification token
    const token = await new Token({
      userId : user._id,
      token: crypto.randomBytes(32).toString('hex')
    }).save();
    
    //Create email-url
    const emailVerificationUrl = `${process.env.FRONTEND_URL}/users/${user._id}/verify/${token.token}`;

    //create email structure
    const message = `
    <h2>Hello ${user.name}</h2>
    <p>Please use the url below to verify your account</p>  
    <p>This reset link is valid for only 30minutes.</p>
    <a href=${emailVerificationUrl} clicktracking=off>${emailVerificationUrl}</a>
    <p>Regards...</p>
    <p>AFG - DEV TEAM</p>
    `;
    const subject = "Verifiy your account";
    const send_to = user.email;
    const sent_from = process.env.EMAIL_USER;

    try {
		await sendEmail(subject, message, send_to, sent_from);
		res.status(200).json({ success: true, message: "Verification Email Sent" });
	  } catch (error) {
		res.status(500);
		throw new Error("Email not sent, please try again");
	  }
});



//Email-verification
const emailVerification = asyncHandler(async (req, res)=>{
    //find user to send verification link
    const user = await User.findOne({_id : req.params.id});
    if(!user) return res.status(404).json({message:'invalid link!'});

    //Create verification token
    const token = await new Token({
        userId: user._id,
        token: req.params.token
    });
    if(!token) return res.status(404).json({message:'invalid link!'});

    //update user-status after sending verification token
    await User.updateOne({ _id: user._id, verified: true });

    //after clicking verification link, remove token from DB
    await token.remove();

    res.status(200).send({ message: "Email verified successfully" });
});

//Login user
const login = asyncHandler(async (req, res)=>{
   const {email, password} = req.body;
   if(!email) return res.status(400).json({message:'Email is required!'});
   if(!password) return res.status(400).json({message:'Password is required!'});

   //find user to login
   const user = await User.findOne({email});
   if(!user) return res.status(404).json({message:'User not found!'});


   //check for valid password
   const valid = await bcrypt.compare(password, user.password);
   if(!valid) return res.status(400).json({message:'Invalid Password!'});

   //check while user want to login, if its email not verfied;
   if (!user.verified) {
    let token = await Token.findOne({ userId: user._id });
    if (!token) {
        token = await new Token({
            userId: user._id,
            token: crypto.randomBytes(32).toString("hex"),
        }).save();
        const url = `${process.env.FRONTEND_URL}/users/${user._id}/verify/${token.token}`;
        await sendEmail(user.email, "Verify Email", url);
    }

    return res
        .status(400)
        .send({ message: "An Email sent to your account please verify your account" });
    };

    const token = user.generateAuthToken();

    if(user && valid){
       return res.status(200).json(user)
    }

    res.status(200).send({ data: token, message: "logged in successfully" });
});


module.exports = {
    register,
    emailVerification,
    login
}