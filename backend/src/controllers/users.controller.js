import jwt from "jsonwebtoken";
import User from "../models/User.js";
import createError from "http-errors"
import { generateToken } from "../utils/jwt.js";
import sendEmail from "../utils/sendEmail.js";

// .................... Register User ...........................................
export const registerUser = async (req, res, next) => {
  try {
    let { fullName, email, username, password,role } = req.body;

    if (!fullName || !email || !username || !password) {
      return next(createError(400, "All fields are required."));
    }

    // Normalize email & username
    email = email.toLowerCase().trim();
    username = username.toLowerCase().trim();

    // Check if user exists by email OR username
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return next(
        createError(
          400,
          existingUser.email === email
            ? "Email already in use."
            : "Username already in use."
        )
      );
    }

    // Create new user
    const user = new User({ fullName, email, username, password,role });
    await user.save();

    // Generate JWT token
    const token = generateToken({ userId: user._id });

    // Set cookie
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: isProd,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(201).json({
      message: "User registered successfully.",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("[registerUser] error:", error);
    next(error);
  }
};

// .................... Login User ...........................................
export const loginUser = async (req, res, next) => {
  try {
    const { identifier, email, username, password } = req.body;

    if (!password || !(identifier || email || username)) {
      return next(createError(400, "Email/username and password are required."));
    }

    // pick whichever is provided
    const id = (identifier || email || username).toLowerCase().trim();

    // Look up by email OR username
    const user = await User.findOne({
      $or: [{ email: id }, { username: id }],
    }).select("+password");

    if (!user) {
      return next(createError(400, "Invalid email/username or password."));
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(createError(400, "Invalid email/username or password."));
    }

    // Generate JWT token
    const token = generateToken({ userId: user._id });

    // Set cookie
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: isProd,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Respond with safe data
    res.status(200).json({
      message: "Login successful.",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("[loginUser] error:", error);
    next(error);
  }
};

// .......... Get current user profile.......................................
export const getMe = async (req, res, next) => {
  try {
    const user = req.user; 
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

//................... Logout user.......................
export const logoutUser = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logout successful" });
};


//................... forgot password.......................
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next(createError(400, "Email is required."));

    const user = await User.findOne({ email });
    if (!user) return next(createError(404, "User not found."));
console.log("CLIENT_URL from env:", process.env.CLIENT_URL);
    // Generate a short-lived JWT (e.g. 15 minutes)
    const resetToken = generateToken({ userId: user._id });
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <p>Hi ${user.fullName || "User"},</p>
        <p>You requested a password reset. Click below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 15 minutes.</p>
      `,
    });

    res.status(200).json({ message: "Password reset link sent to your email." });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) return next(createError(400, "Password is required."));

    // Verify the JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("+password");
    if (!user) return next(createError(404, "User not found."));

    user.password = password; // hashing should occur in your User model pre-save hook
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully." });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(createError(400, "Reset link has expired."));
    }
    next(error);
  }
}