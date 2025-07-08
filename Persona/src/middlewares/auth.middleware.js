import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")//for Mobile apps / Postman / APIs using headers 
    
        if(!token){
            throw new ApiError(401, "Unauthorised request");
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) //sometimes hv to use await
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(401,"Invalid access Token");
        }
    
         req.user = user;
         next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
})