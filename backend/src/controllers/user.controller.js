import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import validator from "validator"
import jwt from "jsonwebtoken"

//to avoid modification of cookies through frontend 
const options = {
    httpOnly:true,
    secure:true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
}

const generateAccessTokenAndRefreshToken = async (userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false});

        return {accessToken,refreshToken};
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating tokens")
    }
}

const registerUser = asyncHandler(async (req,res)=>{
    const {name,email,password,role="customer"} = req.body;

    if([name,email,password].some(field=>!field)){
        throw new ApiError(400,"Name, Email & Password are must");
    }
    //check if user already exist
    const existedUser = await User.findOne({email});
    if(existedUser){
        throw new ApiError(409,"User already exist")
    }
    //check for invalid role
    const allowedRoles = ['customer', 'admin'];
    if (role && !allowedRoles.includes(role)) {
        throw new ApiError(400, 'Invalid role');
    }

    //email validation
    if (!validator.isEmail(email)) {
        throw new ApiError(400, 'Invalid email format');
    }

    const user = await User.create({
        name,
        email,
        password,
        role,
    })
    
    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if(!createdUser) throw new ApiError(500,"Something went wrong while registering the user");

    return res.status(201).json(new ApiResponse(201,createdUser,"User registered Successfully"));
})

const login = asyncHandler(async (req,res)=>{
    const {email,password} = req.body
    if(!(email && password)){
        throw new ApiError(401,"Email and Password are required");
    }

    const userExist = await User.findOne({email});
    if(!userExist){
        throw new ApiError(404,"User not found");
    }

    const isMatch = await userExist.isPasswordCorrect(password);
    if(!isMatch){
        throw new ApiError(401,"Incorrect Password");
    }

    const {refreshToken,accessToken} = await generateAccessTokenAndRefreshToken(userExist._id);

    const loggedInUser = await User.findById(userExist._id).select("-password -refreshToken");
    
    res.status(200)
  .cookie("accessToken", accessToken, { 
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000 // 15 minutes
  })
  .cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  })
  .json(new ApiResponse(200, { user:loggedInUser }, "Login successful"));
})

const logout = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $unset:{
                refreshToken:1
            }   
        },
        {
            new:true
        }
    
    );

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged Out Successfully"));
})

const refreshAcessToken = asyncHandler(async (req,res)=>{
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken

    if(!incomingRefreshToken) throw new ApiError(401,"Unauthorized Request")
    
    const decodeToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodeToken._id);
    if(!user) throw new ApiError(401,"Invalid refresh token: User not found");

    if(incomingRefreshToken !== user?.refreshToken) throw new ApiError(401,"Refresh token is expired or used");

    const {accessToken,refreshToken} = await generateAccessTokenAndRefreshToken(user._id)

    res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(200,"Access token refreshed"))
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body;

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect) throw new ApiError(400,"Invalid Old Password");

    user.password = newPassword;
    await user.save({validateBeforeSave:false});

    return res.status(200).json(
        new ApiResponse(200,{},"Password changed successfully")
    )

})

const getCurrentUser = asyncHandler(async(req,res)=>{
  const user = await User.findById(req.user._id)
  .select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200,user,"Current user fetched successfully"))
})

const deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
  
    if (!userId) {
      throw new ApiError(400, "User ID is required");
    }
  
    const deletedUser = await User.findByIdAndDelete(userId);
  
    if (!deletedUser) {
      throw new ApiError(404, "User not found");
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "User deleted successfully"));
});

const getAllUsers = asyncHandler(async (req, res) => {
    // Fetch all users (excluding sensitive fields)
    const users = await User.find({}).select("-password -refreshToken");
  
    // Check if users exist
    if (!users || users.length === 0) {
      throw new ApiError(404, "No users found");
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, users, "Users fetched successfully"));
});

const updateUserRole = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;
  
    // Check if userId and role are provided
    if (!userId || !role) {
      throw new ApiError(400, "User ID and role are required");
    }
  
    // Validate the role
    const allowedRoles = ["admin", "customer", "tailor"];
    if (!allowedRoles.includes(role)) {
      throw new ApiError(400, "Invalid role");
    }
  
    // Find and update the user's role
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password -refreshToken");
  
    // Check if the user was found and updated
    if (!updatedUser) {
      throw new ApiError(404, "User not found");
    }
  
    // Return success response
    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "User role updated successfully"));
});


export {
    registerUser,
    login,
    logout,
    refreshAcessToken,
    changeCurrentPassword,
    getCurrentUser,
    deleteUser,
    getAllUsers,
    updateUserRole,
}