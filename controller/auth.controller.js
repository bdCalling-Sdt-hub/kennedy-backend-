const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { success, failure, generateRandomCode } = require("../utilities/common");
const User = require("../model/user.model");
const Notification = require("../model/notification.model");
const Affiliate = require("../model/affiliate.model");
const HTTP_STATUS = require("../constants/statusCodes");
const { emailWithNodemailerGmail } = require("../config/email.config");
const crypto = require("crypto");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const signup = async (req, res) => {
  try {
    // const validation = validationResult(req).array();
    // console.log(validation);
    // if (validation.length > 0) {
    //   return res
    //     .status(HTTP_STATUS.OK)
    //     .send(failure("Failed to add the user", validation[0].msg));
    // }

    // if (req.body.role === "admin") {
    //   return res
    //     .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
    //     .send(failure(`Admin cannot be signed up`));
    // }

    if (!req.body.email || !req.body.password) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("please provide mail and password"));
    }

    const emailCheck = await User.findOne({ email: req.body.email });

    if (emailCheck && !emailCheck.emailVerified) {
      const emailVerifyCode = generateRandomCode(4); //4 digits
      emailCheck.emailVerifyCode = emailVerifyCode;
      await emailCheck.save();

      const emailData = {
        email: emailCheck.email,
        subject: "Account Activation Email",
        html: `
                      <div style="max-width: 500px; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); text-align: center; font-family: Arial, sans-serif;">
      <h6 style="font-size: 16px; color: #333;">Hello, ${
        emailCheck?.name || "User"
      }</h6>
      <p style="font-size: 14px; color: #555;">Your email verification code is:</p>
      <div style="font-size: 24px; font-weight: bold; color: #d32f2f; background: #f8d7da; display: inline-block; padding: 10px 20px; border-radius: 5px; margin-top: 10px;">
        ${emailVerifyCode}
      </div>
      <p style="font-size: 14px; color: #555;">Please use this code to verify your email.</p>
    </div>
                      
                    `,
      };
      emailWithNodemailerGmail(emailData);

      return res
        .status(HTTP_STATUS.OK)
        .send(success("Please verify your email"));
    }

    if (emailCheck) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure(`User with email: ${req.body.email} already exists`));
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const emailVerifyCode = generateRandomCode(4); //4 digits

    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      role: req.body.role || "user",
      password: hashedPassword,
      emailVerifyCode,
    });

    // payload, secret, JWT expiration
    // const token = jwt.sign({id: newUser._id}, process.env.JWT_SECRET, {
    //     expiresIn: process.env.JWT_EXPIRES_IN
    // })

    const emailData = {
      email: req.body.email,
      subject: "Account Activation Email",
      html: `
                  <h6>Hello, ${newUser?.name || newUser?.email || "User"}</h6>
                  <p>Your email verification code is <h6>${emailVerifyCode}</h6> to verify your email</p>
                  
                `,
    };

    emailWithNodemailerGmail(emailData);

    const token = jwt.sign(newUser.toObject(), process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    res.setHeader("Authorization", token);
    if (newUser) {
      return res
        .status(HTTP_STATUS.OK)
        .send(success("Account created successfully ", { newUser, token }));
    }
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .send(failure("Account couldnt be created"));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(`INTERNAL SERVER ERROR`);
  }
};

const signupAsAffiliate = async (req, res) => {
  try {
    if (!req.body.email || !req.body.password) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("please provide mail and password"));
    }

    const emailCheck = await User.findOne({ email: req.body.email });

    const admin = await User.findOne({ role: "admin" });

    // if (!admin) {
    //   return res.status(HTTP_STATUS.NOT_FOUND).send(failure("Admin not found"));
    // }

    if (emailCheck && emailCheck.affiliateApplicationStatus === "pending") {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(
          failure(
            `${req.body.email} has already applied to become an affiliate. Please wait for the approval.`
          )
        );
    }

    if (
      emailCheck &&
      (emailCheck.isAffiliate === true ||
        emailCheck.affiliateApplicationStatus === "approved")
    ) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure(`${req.body.email} is already an affiliate.`));
    }

    if (emailCheck) {
      emailCheck.affiliateApplicationStatus = "pending";
      await emailCheck.save();

      const emailVerifyCode = generateRandomCode(4); //4 digits
      emailCheck.emailVerifyCode = emailVerifyCode;
      await emailCheck.save();

      if (!emailCheck.emailVerified) {
        const emailData = {
          email: emailCheck.email,
          subject:
            "Account Activation & Affiliate Application Successful Email",
          html: `
                        <h1>Hello, ${emailCheck?.name || "User"}</h1>
                        <p>Congrats, you have successfully applied to become an affiliate. Please wait for the approval</p>
                        <p>Your email verification code is <h3>${emailVerifyCode}</h3></p>
                        
                      `,
        };
        emailWithNodemailerGmail(emailData);
      }

      const newNotification = await Notification.create({
        applicant: emailCheck._id,
        admin: admin._id || null,
        status: "pending",
        message: `${emailCheck.email} has applied for the affiliate role.`,
      });

      if (!newNotification) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .send(failure("Could not send notification"));
      }

      emailCheck.notifications.push(newNotification._id);
      await emailCheck.save();

      if (admin) {
        admin.notifications.push(newNotification._id);
        await admin.save();
      }

      return res
        .status(HTTP_STATUS.OK)
        .send(
          success(
            "You have successfully applied to become an affiliate. Please wait for the approval."
          )
        );
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      affiliateApplicationStatus: "pending",
      // phone: req.body.phone,
      // gender: req.body.gender,
    });

    if (!newUser) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Account couldnt be created"));
    }

    const emailVerifyCode = generateRandomCode(4); //4 digits
    newUser.emailVerifyCode = emailVerifyCode;
    await newUser.save();
    const emailData = {
      email: newUser.email,
      subject: "Account Activation & Affiliate Application Successful Email",
      html: `
                    <h6>Hello, ${newUser?.name || newUser?.email || "User"}</h6>
                    <p>Congrats, you have successfully applied to become an affiliate</p>
                    <p>Your email verification code is <h6>${emailVerifyCode}</h6></p>
                    
                  `,
    };
    emailWithNodemailerGmail(emailData);

    const newNotification = await Notification.create({
      applicant: newUser._id,
      admin: admin._id || null,
      status: "pending",
      message: `${newUser.email} has applied for to be an affiliate.`,
    });

    if (!newNotification) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Could not send notification"));
    }

    newUser.notifications.push(newNotification._id);
    await newUser.save();

    if (admin) {
      admin.notifications.push(newNotification._id);
      await admin.save();
    }

    res
      .status(HTTP_STATUS.OK)
      .send(
        success(
          "Account created successfully & applied to become an affiliate",
          { user: newUser }
        )
      );
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(`INTERNAL SERVER ERROR`);
  }
};

const createAdmin = async (req, res) => {
  try {
    // const validation = validationResult(req).array();
    // console.log(validation);
    // if (validation.length > 0) {
    //   return res
    //     .status(HTTP_STATUS.OK)
    //     .send(failure("Failed to add the user", validation[0].msg));
    // }

    if (!req.body.email || !req.body.password) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("please provide mail and password"));
    }

    const emailCheck = await User.findOne({ email: req.body.email });

    if (emailCheck && !emailCheck.emailVerified) {
      const emailVerifyCode = generateRandomCode(4); //4 digits
      emailCheck.emailVerifyCode = emailVerifyCode;
      await emailCheck.save();

      const emailData = {
        email: emailCheck.email,
        subject: "Account Activation Email",
        html: `
                      <h6>Hello, ${
                        emailCheck?.name || emailCheck?.email || "User"
                      }</h6>
                      <p>Your email verification code is <h6>${emailVerifyCode}</h6> to verify your email</p>
                      
                    `,
      };
      emailWithNodemailerGmail(emailData);

      return res
        .status(HTTP_STATUS.OK)
        .send(
          success(
            `User with email: ${req.body.email} already exists. Please verify your email`
          )
        );
    }

    if (emailCheck) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure(`User with email: ${req.body.email} already exists`));
    }

    if (req.body.password !== req.body.confirmPassword) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Passwords do not match"));
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const emailVerifyCode = generateRandomCode(4); //4 digits

    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
      password: hashedPassword,
      emailVerifyCode,
    });

    // payload, secret, JWT expiration
    // const token = jwt.sign({id: newUser._id}, process.env.JWT_SECRET, {
    //     expiresIn: process.env.JWT_EXPIRES_IN
    // })

    const emailData = {
      email: req.body.email,
      subject: "Account Activation Email",
      html: `
                  <h6>Hello, ${newUser?.name || newUser?.email || "User"}</h6>
                  <p>Your email verification code is <h6>${emailVerifyCode}</h6> to verify your email</p>
                  
                `,
    };

    emailWithNodemailerGmail(emailData);

    const token = jwt.sign(newUser.toObject(), process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    res.setHeader("Authorization", token);
    if (newUser) {
      return res
        .status(HTTP_STATUS.OK)
        .send(
          success("Admin Account created successfully ", { newUser, token })
        );
    }
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .send(failure("Admin Account couldnt be created"));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(`INTERNAL SERVER ERROR`);
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, emailVerifyCode } = req.body;
    if (!email || !emailVerifyCode) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide email and verification code"));
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("User does not exist"));
    }

    if (user.emailVerifyCode !== emailVerifyCode) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Invalid verification code"));
    }

    user.emailVerified = true;
    user.emailVerifyCode = null;
    await user.save();

    const token = jwt.sign(user.toObject(), process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    res.setHeader("Authorization", token);
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Email verified successfully", { token }));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(`INTERNAL SERVER ERROR`);
  }
};

const approveAffiliate = async (req, res) => {
  try {
    const { affiliateId, domain } = req.body;

    if (!affiliateId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide affiliateId"));
    }

    if (!req.user) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Unauthorized! Admin access only"));
    }

    const affiliate = await User.findById({ _id: affiliateId });
    const admin = await User.findOne({ email: req.user.email });

    if (!affiliate) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("affiliate does not exist"));
    }

    const referralCode = crypto.randomBytes(4).toString("hex");
    const referralLink = `${domain}/referral/${referralCode}`; //referralLink

    const newAffiliate = new Affiliate({
      user: affiliate._id,
      referralLink,
      affiliateCode: referralCode,
    });

    await newAffiliate.save();

    if (!newAffiliate) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Could not create affiliate"));
    }
    affiliate.affiliateApplicationStatus = "approved";
    affiliate.isAffiliate = true;
    affiliate.affiliate = newAffiliate._id;
    await affiliate.save();

    const emailData = {
      email: affiliate.email,
      subject: "Application Approved - Welcome to Our amazing business!",
      html: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h5 style="color: #4CAF50;">Congratulations, ${
                  affiliate.name || affiliate.email || "User"
                }!</h5>
                <p>We are pleased to inform you that your application to join our business as an affiliate has been <strong>approved</strong>.</p>
                
                <p>Thank you for choosing to collaborate with us, and we look forward to working with you.</p>
                
                <p>Below are some important next steps to get started:</p>
                <ul>
                  <li>Complete your profile.</li>
                  <li>Review our policies and guidelines.</li>
                </ul>

                <p>If you have any questions, feel free to reach out to us at any time.</p>

                <p>Sincerely,<br/>
                <strong>passengers confession</strong><br/>
                <a href="mailto:support@passengersconfession.com">support@passengersconfession.com</a></p>
              </body>
            </html>
          `,
    };
    emailWithNodemailerGmail(emailData);

    // Create a new notification for the admin doctor
    const newNotification = await Notification.create({
      applicant: affiliate._id,
      admin: admin._id,
      status: "approved",
      message: `your application has been approved.`,
    });

    if (!newNotification) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Could not send notification"));
    }

    affiliate.notifications.push(newNotification._id);
    await affiliate.save();

    admin.notifications.push(newNotification._id);
    await admin.save();

    return res
      .status(HTTP_STATUS.OK)
      .send(success("affiliate application approved", affiliate));
  } catch (err) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Failed to approve affiliate application"));
  }
};

const connectStripeAccount = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("please login"));
    }
    const affiliate = await Affiliate.findOne({ user: req.user._id });
    console.log("affiliate", affiliate);
    console.log("req.user._id", req.user._id);
    if (!affiliate) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("affiliate does not exist"));
    }
    const { frontendURL } = req.body;
    if (!affiliate.stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: req.user.email,
        capabilities: { transfers: { requested: true } },
      });
      affiliate.stripeAccountId = account.id;
      await affiliate.save();
    }

    // Generate Stripe account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: affiliate.stripeAccountId,
      refresh_url: `${frontendURL}`,
      return_url: `${frontendURL}`,
      type: "account_onboarding",
    });

    if (!accountLink) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Could not create account link"));
    }

    return res
      .status(HTTP_STATUS.OK)
      .send(success("account link created", accountLink));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(`INTERNAL SERVER ERROR`);
  }
};

const cancelAffiliate = async (req, res) => {
  try {
    const { affiliateId } = req.body;

    if (!affiliateId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide affiliateId"));
    }

    if (!req.user) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Unauthorized! Admin access only"));
    }

    const affiliate = await User.findById(affiliateId);
    const admin = await User.findOne({ email: req.user.email });

    if (!affiliate) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("affiliate not found"));
    }

    if (
      affiliate.affiliateApplicationStatus === "cancelled" ||
      affiliate.affiliateApplicationStatus === "notApplied"
    ) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("User did not apply for affiliate's position yet"));
    }

    affiliate.affiliateApplicationStatus = "cancelled";
    affiliate.isAffiliate = false;

    const emailData = {
      email: affiliate.email,
      subject: "Application Status - Affiliate Application",
      html: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2 style="color: #f44336;">Dear Dr. ${
                affiliate.name || affiliate.email || "User"
              },</h2>
              <p>We regret to inform you that after careful review, your application to join our business as an affiliate has been <strong>declined</strong> at this time.</p>
              
              <p>We appreciate your interest in collaborating with us. Unfortunately, we are unable to proceed with your application due to the current needs and requirements of our team.</p>
              
              <p>If you have any questions or would like further clarification, please do not hesitate to reach out. We encourage you to reapply in the future as new opportunities may become available.</p>

              <p>Thank you once again for your interest, and we wish you success in your future endeavors.</p>

              <p>Sincerely,<br/>
              <strong>Passengers Confession</strong><br/>
              <a href="mailto:support@passengersconfession.com">support@passengersconfession.com</a></p>
            </body>
          </html>
                  `,
    };
    emailWithNodemailerGmail(emailData);
    console.log(affiliate.email);

    await affiliate.save();

    // Create a new notification for the admin doctor
    const newNotification = await Notification.create({
      applicant: affiliate._id,
      admin: admin._id,
      status: "cancelled",
      message: `application has been cancelled.`,
    });

    if (!newNotification) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Could not send notification"));
    }

    affiliate.notifications.push(newNotification._id);
    await affiliate.save();

    admin.notifications.push(newNotification._id);
    await admin.save();

    return res
      .status(HTTP_STATUS.OK)
      .send(success("affiliate application cancelled", affiliate));
  } catch (err) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Failed to cancel affiliate application"));
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // check if email & pass exist
    if (!email || !password) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("please provide mail and password"));
    }

    // fetching the fields
    const user = await User.findOne({ email }).select(
      "+password -__v -isLocked -createdAt -updatedAt -doctorApplicationStatus -isDoctor -notifications -consultationHistory -consultationUpcoming -services -reviews"
    );

    if (!user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("not registered. please sign up"));
    }
    // when the user doesnt exist or pass dont match
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("wrong email or password"));
    }

    // object conversion
    const userObj = user.toObject();

    // token
    const token = jwt.sign(user.toObject(), process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    // deleting unnecessary fields
    user.password = undefined;
    delete userObj.password;
    delete userObj.isLocked;
    delete userObj.createdAt;
    delete userObj.updatedAt;
    delete userObj.__v;

    res.setHeader("Authorization", token);
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Logged in successfully", { user, token }));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const logout = async (req, res) => {
  try {
    const token = req.headers.authorization
      ? req.headers.authorization.split(" ")[1]
      : null;
    if (!token) {
      // No token means user is not logged in
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("You are not logged in"));
    }
    console.log("after reset", res);
    return res.status(HTTP_STATUS.OK).send(success("Logged out successfully"));
  } catch (err) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Logout failed"));
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide email"));
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("User with this email does not exist"));
    }
    const emailVerifyCode = generateRandomCode(4); //4 digits

    user.emailVerifyCode = emailVerifyCode;
    user.emailVerified = false;
    await user.save();

    const emailData = {
      email,
      subject: "Password Reset Email",
      html: `
        <h6>Hello, ${user.name || "User"}</h6>
        <p>Your Email verified Code is <h6>${emailVerifyCode}</h6> to reset your password</p>
        <small>This Code is valid for 3 minutes</small>
      `,
    };
    await emailWithNodemailerGmail(emailData);
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Verification code sent successfully"));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
    if (!email || !newPassword || !confirmPassword) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide email, password and confirm password"));
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("User with this email does not exist"));
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Password and confirm password do not match"));
    }

    if (!user.emailVerified) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please verify your email first"));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.emailVerifyCode = null;

    await user.save();
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Password reset successfully"));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const changePassword = async (req, res) => {
  try {
    const { email, oldPassword, newPassword, confirmPassword } = req.body;
    if (!email || !oldPassword || !newPassword || !confirmPassword) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(
          failure(
            "Please provide email, old password, new password and confirm password"
          )
        );
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("New password and confirm password do not match"));
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("User with this email does not exist"));
    }

    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordMatch) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Old password is incorrect"));
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Password changed successfully"));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const sendOTPAgain = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide email"));
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("User with this email does not exist"));
    }
    const emailVerifyCode = generateRandomCode(4); //4 digits
    user.emailVerifyCode = emailVerifyCode;

    await user.save();

    const emailData = {
      email,
      subject: "OTP Verification",
      html: `
        <h6>Hello, ${user.name || "User"}</h6>
        <p>Your OTP is <h6>${emailVerifyCode}</h6> to verify your email</p>
        <small>This OTP is valid for 5 minutes</small>
      `,
    };
    await emailWithNodemailerGmail(emailData);
    return res.status(HTTP_STATUS.OK).send(success("OTP sent successfully"));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};
module.exports = {
  signup,
  signupAsAffiliate,
  connectStripeAccount,
  approveAffiliate,
  cancelAffiliate,
  login,
  createAdmin,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  sendOTPAgain,
};
