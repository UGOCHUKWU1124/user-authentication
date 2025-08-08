import User from '../model/userModel.js'; 
import bcryptjs from 'bcryptjs';
import crypto from 'crypto'; //importing crypto for generating secure random tokens
import { generateVerificationToken } from '../utils/generateVerificationToken.js'; //importing a utility function to generate verification codes
import { generateTokenAndSetCookie } from '../utils/generateTokenAndSetCookie.js'; //importing a utility function to generate JWT tokens and set cookies
import { sendPasswordResetEmail, sendResetSuccessEmail, sendVerificationEmail, sendWelcomeEmail } from '../mailtrap/emails.js';
export const signup = async  (req, res) => {
    const {email,password,name} = req.body; //extracting email, password, and name from the request body when a user signs up
    
    console.log('Signup request received:', { email, name }); // Debug log
    try{
        if (!email || !password || !name){
            throw new Error ("All fields are required")
        }

        const userAlreadyExists = await User.findOne({email});
        if(userAlreadyExists){
            return res.status(400).json({success:false, message: "User already exists"})
        }

        const hashedPassword = await bcryptjs.hash(password,15); //hashing the password using bcryptjs with a salt rounds of 15 this provides a good balance between security and performance
        const verificationToken = generateVerificationToken();
        const user = new User({
            email,
            password: hashedPassword,
            name,
            verificationToken,
            verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000 //24hours
        })
        await user.save(); //saving the user to the database

        //jwt
        generateTokenAndSetCookie(res,user._id); 
        res.status(201).json({
            success:true,
            message:"User created successfully",
            user:{
                ...user._doc, //spreading the user document to include all fields except the password
                password:undefined // explicitly setting password to undefined to avoid sending it in the response
            },
        });

        //send verification email
        await sendVerificationEmail(user.email, verificationToken);

    }
    catch(error){
        res.status(400).json({success:false, message: error.message})

    }
}
export const verifyEmail = async (req, res) => {
    const {verificationToken} = req.body;
    
    if (!verificationToken) {
        return res.status(400).json({
            success: false,
            message: "Verification code is required"
        });
    }

    try {
        console.log('Verifying token:', verificationToken); // Debug log
        
        const user = await User.findOne({
            verificationToken: verificationToken, 
            verificationTokenExpires: {$gt: Date.now()}
        }); //checking if the user exists with the provided verification token and if the token has not expired

        if(!user){
            console.log('No user found with token or token expired'); // Debug log
            return res.status(400).json({success:false, message: "Invalid or expired verification code"});
        }

        // Update user verification status
        user.isVerified = true; //setting the user as verified
        user.verificationToken = undefined; //clearing the verification token
        user.verificationTokenExpiresAt = undefined; //clearing the verification token expiration time
        await user.save(); //saving the user to the database

        // Generate new JWT token after verification
        generateTokenAndSetCookie(res, user._id);

        // Send welcome email
        await sendWelcomeEmail(user.email, user.name);

        res.status(200).json({
            success: true, 
            message: "Email verified successfully",
            user: {
                ...user._doc,
                password: undefined
            }
        });

    } catch(error) {
        console.error('Verification error:', error); // Debug log
        res.status(500).json({
            success: false,
            message: "Error verifying email",
            error: error.message
        });
    }
}
export const login = async  (req, res) => {
const {email,password} = req.body; //extracting email and password from the request body when a user logs in

    console.log('Login request received:', { email }); // Debug log
    try{
        if (!email || !password){
            throw new Error ("All fields are required")
        }

        const user = await User.findOne({email}); //finding the user by email
        if(!user){
            return res.status(400).json({success:false, message: "Invalid user email"})
        }

        const isPasswordMatch = await bcryptjs.compare(password, user.password); //comparing the provided password with the hashed password in the database
        if(!isPasswordMatch){
            return res.status(400).json({success:false, message: "Invalid user password"})
        }

        if(!user.isVerified){
            return res.status(400).json({success:false, message: "Please verify your email first"})
        }

        generateTokenAndSetCookie(res,user._id);
        user.lastLogin = Date.now(); //updating the last login time
        await user.save(); //saving the user to the database
        res.status(200).json({
            success:true,
            message:"Logged in successfully",
            user:{
                ...user._doc,
                password:undefined
            }
        })
    }
    catch(error){
        console.error('Login error:', error); // Debug log
        res.status(400).json({success:false, message: error.message})
    }
}

export const logout = async  (req, res) => {
    res.clearCookie("token"); //clearing the token cookie
    res.status(200).json({success:true, message:"Logged out successfully"});
}  

export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Generate a password reset token
        const resetToken = crypto.randomBytes(32).toString('hex'); //using crypto to generate a secure random token
        const resetTokenExpires = Date.now() + 15 * 60 * 1000; // Token valid for 15 minutes
        user.resetPasswordToken = resetToken; //setting the reset token
        user.resetPasswordExpires = resetTokenExpires; //setting the reset token expiration time
        await user.save();

        // Send the reset token to the user's email
        await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`);

        res.status(200).json({ success: true, message: "Password reset email sent" });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: "Error processing request" });
    }
}

export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params; //extracting the token from url parameters
        const { password } = req.body;//extracting the new password from the request body

        if (!token || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired token" });
        }

        const hashedPassword = await bcryptjs.hash(password, 15); //hashing the new password using bcryptjs with a salt rounds of 15
        user.password = hashedPassword; //hashing the new password
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        sendResetSuccessEmail(user.email); //sending a success email after password reset

        res.status(200).json({ success: true, message: "Password reset successfully" });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: "Error processing request" });
    }
}
export const checkAuth = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password"); //finding the user by id and excluding the password field
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('Check auth error:', error);
        res.status(500).json({ success: false, message: "Error processing request" });
    }

    // This function checks if the user is authenticated by verifying the JWT token in the request cookies
    // If the token is valid, it retrieves the user from the database and returns their information 
    // If the token is invalid or expired, it responds with an error message
    // This function is typically used to protect routes that require user authentication, ensuring that only authenticated users can access certain resources or perform specific actions in the application.  
}
