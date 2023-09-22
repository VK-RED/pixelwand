import express from "express";
import mongoose from "mongoose";
import 'dotenv/config';
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import { User } from "./db/models/User.js";
import { Session } from "./db/models/Session.js";
import jwt from "jsonwebtoken";
import { auth } from "./middlewares/auth.js";
import {z} from 'zod';

const PORT = 3000;

const app = express();
app.use(bodyParser.json());

//Initiate Mongoose Connection
mongoose.connect(process.env.MONGO_URL,{dbName:"assignment"});


/*
    - Using zod for Input Validation
    - Only if the inputs are sent in appropriate manner, we create an account . Else we restrict 
      users from signing up and throw appropriate error messages

    - Get the email, password and name. Hash the password. Save the details in User collection.
    - Generate a token. Save the session details in Session Collection
*/

// This will be the Schema for Validating the Signup Input
const SignupSchema = z.object({
    name:z.string(),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(8).max(12),
})

app.post("/signup",async(req,res)=>{

    const result = SignupSchema.safeParse(req.body);

    if(result.success){

        const {name,email,password} = req.body;

        const user = await User.findOne({email});
        if(user) return res.json({message:"Already SignedUp, kindly please login"});

        try {
            const hash = await bcrypt.hash(password, 3);

            const newUser = new User({email, password:hash, name});
            await newUser.save();

            const token = jwt.sign({userId:newUser._id}, "S3CR3T", {expiresIn:'24h'});

            const newSession = new Session ({userId:newUser._id, token});
            newSession.save();

            return res.status(202).json({token, message:"Account Created Successfully"});

        } catch (error) {
            console.log(error);
            return res.status(404).json({message:"Can't Signup , Something went wrong"});
        }
    }
    else{
        
        return res.status(404).json({message:result.error.errors});
    }

    
})

                            



/*
    Get the email , password
    Check whether acc exists 
    if yes , verify the entered password with the hashed pass from DB
    on Successful verification, generate token
    create a new session, with the token and userId , save the newSession
    return token || error message
*/

app.post("/login",async(req,res)=>{

    const {email,password} = req.body;
    if(!email || !password) return res.status(404).json({message:"Email or Password missing"});

    const user = await User.findOne({email});

    if(!user) return res.status(404).json({message:"Kindly Please Signup First"});

    try {
        const hash = user.password;
        const result = await bcrypt.compare(password, hash);

        if(!result) return res.status(404).json({message:"Please Enter a Correct Password"});

        const token = jwt.sign({userId:user._id}, "S3CR3T", {expiresIn:"24h"});

        const session = new Session({userId:user._id, token});
        await session.save();
        
        return res.status(202).json({token});


    } catch (error) {
        console.log(error);
        return res.status(505).json({message: "Internal Server Error"});
    }
})




/*
    Check if the token exists, then check whether it's a valid token in D.B
    If it is valid remove it in D.B and send the message
*/


app.post("/logout", async(req,res)=>{
    const token = req.headers["authorization"];

    if(!token) return res.status(402).json({message:"Token Missing"});

    try {

        const isSession = await Session.findOne({token});

        if(!isSession) return res.status(404).json({message:"Please Enter the correct Token"});

        await Session.findOneAndDelete({token});

        return res.status(202).json({message:"Logged Out Successfully !!!"});
        
    } catch (error) {
        console.log(error);
        return res.status(505).json({message:"Internal Server Error"});
    }

    
})

/*
    Since it's a protected Route, we use the auth middleware
    Only if the auth middleware, succeeds this protected route will be hit
    We extract the token and get the userDetails and return the details back to the user
*/

app.get("/me", auth, async(req,res)=>{
    const token = req.headers["authorization"];

    try {
        
        const session = await Session.findOne({token});
        const userId = session.userId;
        const user = await User.findById(userId);

        const{name,email} = user;
        return res.status(202).json({name, email, token});

    } catch (error) {
        console.log(error);
        return res.status(505).json({message:"Internal Server Error"});
    }
})



app.listen(PORT, ()=>{
    console.log(`The example app is listening on the PORT :${PORT}`);
})