import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email:{
        type:String, 
        required:true,
        unique:true //it makes sure that the email is unique in the database
    },
    password:{
        type:String,
        required:true,
        unique:false //passwords do not need to be unique, as multiple users can have the same password
    },
    name:{
        type:String,
        required:true,
        unique:false //names do not need to be unique, as multiple users can have the same name
    },
    lastLogin:{
        type:Date,
        default:Date.now
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    resetPasswordToken:String,
    resetPasswordExpires:Date,  
    verificationToken:String,
    verificationTokenExpires:Date
}, {timestamps:true});
//createdAt and updatedAt will be created automatically


const User = mongoose.model('User',userSchema);
export default User;
