import jwt from "jsonwebtoken";
import { Session } from "../db/models/Session.js";

/*  
    Get the token, if there is no token return user back

    validate the token
        - if the validation gets succeeded, call the protected route
        - else
            - check whether the token present in sessions
                - if not present return the user back
                - else (Renew the token)
                    - get the userId from the session
                    - remove the old session from D.B
                    - create a new Session with the userId and save it 
                    - set the new token in req.headers and call the next(); 

*/

async function auth(req, res, next){

    let token = req.headers["authorization"];

    if(!token) return res.status(404).json({message:"Token Missing"});

    try {

        const decoded = jwt.verify(token, "S3CR3T");

        if(decoded.userId) next();

    } catch (error) {
        

        const session = await Session.findOne({token});
        if(!session) return res.status(404).json({message:"Enter a Valid Token"});

        //token refreshment -> Delete Old Session and create a New Session
        await Session.findOneAndDelete({token});

        const userId = session.userId;
        token = jwt.sign({userId}, "S3CR3T", {expiresIn:"24h"});

        const newSession = new Session({userId, token});
        await newSession.save();

        req.headers["authorization"] =  token;

        next();

    }

    

}

export {auth};