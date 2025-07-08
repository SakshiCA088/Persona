import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave : false })

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens");
        
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // res.status(200).json({
    //     message : "register route working for post method"
    // })

    //get user details from frontend
    //validation - non empty
    //checkif user already exists : username, email
    //check for images, avatar
    //upload to cloudinary, avatar
    //create user object - create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return res

    const {fullname, email, username, password} = req.body
    //console.log("email : ", email)

    // if(fullname === ""){
    //     throw new ApiError(400, "fullname is required")
    // }

    if(
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    if(!email.toLowerCase().endsWith("@gmail.com")){
        throw new ApiError(400, "Invalid email")
    }

    const existedUser = await User.findOne({
        $or: [ { username } , { email } ]
    })

    if(existedUser){
        throw new ApiError(409, "User with same email/username exists");   
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    //const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath) //if cloudinary doesn't find an image it returns an empty string

    if(!avatar){
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverImage : coverImage?.url||"", //if coverImgae undefined bn gya to optinally bhi kese nikalenge url, hence old way
        email,
        password,
        username : username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" 
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering a user.");
    }

    //return res.status(201).json({createdUser}) this will also work, but we want a proper organised code
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

})

const loginUser = asyncHandler( async (req, res) => {
    //req body -> data
    //find username email
    //check pass
    //generate refresh and access tokens
    //send tokens via cookies
    //send res 

    const {email, username, password} = req.body

    if(!username && !email){
        throw new ApiError(400, "Username or password is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "user does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)//(name, value, properties)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user : loggedInUser, accessToken, refreshToken
            },
            "User logged in successfully!"
        )
    )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken : undefined //changind the value using $set operator
            }
        },
        // {
        //     new:true //can add new values like this
        // }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))
})

const refreshAccessToken = asyncHandler ( async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorised request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token");
        }
    
        if(incomingRefreshToken !== user.refreshToken){    //encoded tokens comparing to ensure the refresh token was actually issued to the user and hasn’t been stolen, reused, or forged // second layer of defense
            throw new ApiError(401, "Refresh token is expired or used");
        }
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        const {newAccessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", newAccessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                { accessToken : newAccessToken, refreshToken : newRefreshToken },
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
        
    }
})

export {   
    registerUser, 
    loginUser,
    logoutUser,
    refreshAccessToken
}