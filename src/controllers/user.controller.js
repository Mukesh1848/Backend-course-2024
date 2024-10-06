import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from '../utils/cloudinary.js'

const generateAccessAndRefreshToken = async(userId) =>{
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
      throw new ApiError(500, "Something went wrong while generating access and refresh token...!");
  }
}

const registerUser = asyncHandler(async(req, res) => {
      const { userName, email, password, fullName} = req.body;

     //  first way to check if any fields missing from body 
      // if(!userName || !email || !password || !fullName){
      //    throw new ApiError(401,"Please provide all the required field..!",)
      // }

      //  second way to check if any fields missing from body
      const allFields = [userName, email, password, fullName];
      if(allFields.some((field) => field?.trim() === "")){
        throw new ApiError(401,"Please provide all the required field..!",)
      }

      // check if user already exit or not using userName or Email
      // const userExits = await User.findOne({
      //    $or : [{ username }, { email }]
      // })
   
      // check if user already exit or not using email 
      const userExits = await User.findOne({email});

      if(userExits){
         throw new ApiError(409,"User already exits with this email or userName...!");
      }

      // const avatarLocalPath = req.files?.avatar[0]?.path;

      // if(!avatarLocalPath){
      //   throw new ApiError(400,"Avatar file is required...!",)
      // }

      // coverImage are optional file(field)
      //const coverImageLocalPath = req.files?.coverImage[0]?.path;

      let coverImageLocalPath;
      if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
          coverImageLocalPath = req.files.coverImage[0].path
      }

      // const avatar = await uploadOnCloudinary(avatarLocalPath);
      // const coverImage = await uploadOnCloudinary(coverImageLocalPath);

      // if(!avatar){
      //   throw new ApiError(400,"Avatar file is required...!",)
      // }

      const user = await User.create({
          userName,
          fullName,
          email,
          password,
          // avatar: avatar?.url,
          // colverImage: coverImage?.url || ''
      })

      const createdUser = await User.findById(user._id).select("-password -refreshToken");

      if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user...!")
      }

      return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully...!")
      )

})

const loginUser = asyncHandler(async(req, res) => {
      const {email, password} = req.body;

      if(!email){
         throw new ApiError(401, "Email and UserName is required...!");
      }

      // check user exits or not using email or userName
      // const userExits = await User.findOne({
      //    $or : [{ username }, { email }]
      // })

      const user = await User.findOne({email});

      if(!user){
        throw new ApiError(401, "User does't exit with this Email...!");
      }

      const isValidPassword = await user.isPasswordCorrect(password); // user.isPassword exit on user.model.js file
      if(!isValidPassword){
        throw new ApiError(401, "Provided Credentials does't exit...!");
      }

      // generate access and refresh token
     const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
     // current logged user
     const loggedInUser = await User.findById(user._id).select('-password -refreshToken');

     const options = {
      httpOnly: true,
      secure: true
     }

     // return response and set cookie in browser
     return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully...!"
        )
    )
})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
      req.user._id,
      {
          $set: {
              refreshToken: undefined  // this will update the user refreshToken field and user get loggedOut
          }
      },
      {
          new: true // return new updated values(refreshToken)
      }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out successFully...!"));
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
      throw new ApiError(401, "unauthorized request")
  }

  try {
      const decodedToken = jwt.verify(
          incomingRefreshToken,
          process.env.REFRESH_TOKEN_SECRET
      )
  
      const user = await User.findById(decodedToken?._id)
  
      if (!user) {
          throw new ApiError(401, "Invalid refresh token")
      }
  
      if (incomingRefreshToken !== user?.refreshToken) {
          throw new ApiError(401, "Refresh token is expired or used")
          
      }
  
      const options = {
          httpOnly: true,
          secure: true
      }
  
      const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
  
      return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
          new ApiResponse(
              200, 
              {accessToken, refreshToken: newRefreshToken},
              "Access token refreshed"
          )
      )
  } catch (error) {
      throw new ApiError(401, error?.message || "Invalid refresh token")
  }

})

export { registerUser, loginUser, logoutUser, refreshAccessToken };