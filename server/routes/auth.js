import express from 'express';

import config from '../config.js';

import { generateAccessToken } from '../helpers/generateAccessToken.js';

const { cypherQuerySession, mySqlDriver, REACT_FRONT_END_URL } = config;

const router = express.Router();

import jwt from 'jsonwebtoken';
import bycrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import {
  authenticateUserMiddleware,
  auditTrailMiddleware
} from '../middleware/authMiddleware.js';
router.post('/login', async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  console.log({
    email,
    password
  });

  try {
    // Connect to the database

    // Query the user by email
    const [rows] = await mySqlDriver.execute(
      `
  SELECT * from admin_account
  WHERE email = ?
  `,
      [email]
    );

    // Check if user exists
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = rows[0];

    // Compare the password with the hash
    const isPasswordValid = password === user.password;
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const accessToken = generateAccessToken(user);

    console.log({ accessToken });

    // Send response with token

    res.json({
      success: true,
      token: accessToken,
      data: {
        // role: 'borrower',
        // userId: user.user_id,
        // email: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/logout', async (req, res) => {
  // Assuming the client stores the token in local storage or cookies
  // You can respond with a message instructing the client to delete the token

  let loggedInUser = req.user;

  console.log({ loggedInUser });

  // await auditTrailMiddleware({
  //   employeeId: loggedInUser.EmployeeID,
  //   action: 'Logout'
  // });
  res.json({
    success: true,
    message:
      'Logged out successfully. Please remove your access token from storage.'
  });
});

router.post('/forgetPassword', async (req, res, next) => {
  try {
    // Find the user by email
    // const user = await User.findOne({ mail: req.body.email });

    let email = req.body.email;

    var [user] = await mySqlDriver.execute(findUserByEmailQuery(email));

    console.log({ user });
    const foundUserByEmail = user.find(u => {
      return u.email === email;
    });

    // If user not found, send error message
    if (!foundUserByEmail) {
      res.status(401).json({
        success: false,
        message: 'Email is not registered in our system.'
      });
    } else {
      // Generate a unique JWT token for the user that contains the user's id
      const token = jwt.sign({ email: foundUserByEmail.email }, 'secret', {
        expiresIn: '10m'
      });

      // Send the token to the user's email
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'avdeasisjewelry2@gmail.com',
          pass: 'dqeq ukrn hvjg vnyx'
        }
      });

      // Email configuration
      const mailOptions = {
        from: 'avdeasisjewelry2@gmail.com',
        to: email,
        subject: 'Reset Password',
        html: `<h1>Reset Your Password</h1>
    <p>Click on the following link to reset your password:</p>
    <a href="${REACT_FRONT_END_URL}/reset-password/${token}">${REACT_FRONT_END_URL}/reset-password/${token}</a>
    <p>The link will expire in 10 minutes.</p>
    <p>If you didn't request a password reset, please ignore this email.</p>`
      };

      // Send the email
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          return res.status(500).send({ message: err.message });
        }
        res.status(200).send({ message: 'Email sent' });
      });
    }
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});
router.post('/reset-password/:token', async (req, res, next) => {
  try {
    // Verify the token sent by the user
    let newPassword = req.body.newPassword;
    const decodedToken = jwt.verify(req.params.token, 'secret');

    // If the token is invalid, return an error
    if (!decodedToken) {
      return res.status(401).send({ message: 'Invalid token' });
    }

    // find the user with the id from the token

    // console.log(decodedToken.email);

    console.log({ decodedToken });
    var [user] = await mySqlDriver.execute(
      findUserByEmailQuery(decodedToken.email)
    );
    const foundUserByEmail = user.find(u => {
      return u.email === decodedToken.email;
    });

    console.log({ foundUserByEmail });
    // If user not found, send error message
    if (!foundUserByEmail) {
      res.status(401).json({
        success: false,
        message: 'Email is not registered in our system.'
      });
    } else {
      var [user] = await mySqlDriver.execute(
        updatePassword(foundUserByEmail.email, newPassword)
      );

      await auditTrailMiddleware({
        employeeId: foundUserByEmail.EmployeeID,
        action: 'Reset Password'
      });

      res.status(200).send({ message: 'Password updated' });
    }

    // Hash the new password
    // const salt = await bycrypt.genSalt(10);
    // req.body.newPassword = await bycrypt.hash(req.body.newPassword, salt);

    // // Update user's password, clear reset token and expiration time
    // user.password = req.body.newPassword;
    // await user.save();

    // // Send success response
  } catch (err) {
    console.log(err);
    // Send error response if any error occurs
    res.status(500).send({ message: err.message });
  }
});

export default router;
