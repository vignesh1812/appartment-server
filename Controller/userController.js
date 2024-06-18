const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const HttpError = require("../Model/errorModel");
// const Ticket = require("../Model/ticketModel");
const User = require("../Model/userModel");
// const Comments = require("../Model/commentModel");
const { v4: uuid } = require("uuid");
const path = require("path");
const fs = require("fs");
const Maintainer = require("../Model/maintainersModel");

// =====================REGISTER USER=======================//
// PROTECTED
// METHOD:POST
// API-END-POINT:api/user/register

const registerUser = async (req, res, next) => {
  try {
    const { username, password, password2, email, role, subrole } = req.body;
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+(@gmail.com)$/gim;

     if (!username || !email || !password || !password2 || !role) {
      return next(new HttpError("Please fill all the Details", 422));
    }

    if (role =="maintainence" && subrole =="") {
      return next(new HttpError("Select Maintainer Role to Submit", 422));
    }
   else

    if (!emailRegex.test(email)) {
      return next(new HttpError("Invalid Email", 422));
    }

    const newEmail = await email.toLowerCase();
    const emailExist = await User.findOne({ email: newEmail });
    if (emailExist) {
      return next(new HttpError("Email Already Exists", 422));
    }
    if (password.trim().length < 8) {
      return next(
        new HttpError("Password Should be atleast 8 Characters", 422)
      );
    }
    if (password != password2) {
      return next(new HttpError("Password Does not match", 422));
    }
    // Hash the password for Security purpose
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username: username,
      email: newEmail,
      password: hash,
      role: role,
      subrole: subrole,
    });
    res
      .status(201)
      .json(`New ${newUser.role} ${newUser.username} Register Successfully`);
  } catch (error) {
    return next(new HttpError("Registration Failed", 422));
  }
};

// =====================LOGIN REGISTER USER=======================//
// PROTECTED
// METHOD:POST
// API-END-POINT:api/user/login

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new HttpError("Please Kindly Fill All the Details"));
    }

    const newEmail = await email.toLowerCase();
    const userEmail = await User.findOne({ email: newEmail });

    if (!userEmail) {
      return next(new HttpError("invalid Email"));
    }

    const comparePass = await bcrypt.compare(password, userEmail.password);

    if (!comparePass) {
      return next(new HttpError("Invalid password", 422));
    }
    // if (userEmail.password=!password) {
    //   return next(new HttpError("Invalid password", 422));
    // }
    const {
      _id: id,
      role,
      subrole,
      email: emailid,
      username,
      profile,
    } = userEmail;
    const token = jwt.sign(
      {
        id: id,
        name: username,
        email: emailid,
        role: role,
        subrole: subrole,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
    res
      .status(200)
      .json({ token, id, emailid, role, subrole, username, profile });
  } catch (error) {
    return next(new HttpError("Login failed,Please Try again!", 422));
  }
};

// =====================GET ALL USERS=======================//
// PROTECTED
// METHOD:GET
// API-END-POINT:api/user/

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// =====================GET SINGLE USER=======================//
// PROTECTED
// METHOD:GET
// API-END-POINT:api/user/:userId

const getSingleUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ _id: userId }).select("-password");
    if (!user) {
      return next(new HttpError("User Not Found", 404));
    }
    res.json(user);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// =====================GET SUBROLE BASED USERS=======================//
// PROTECTED
// METHOD:GET
// API-END-POINT:api/user/role/:subrole

const getSubroleUser = async (req, res, next) => {
  try {
    const { subrole } = req.params;
    const subCodes = ["plumber", "electrical", "hvac", "painter", "technician"];
    if (!subCodes.includes(subrole)) {
      return next(
        new HttpError(
          `Didn't find the ${subrole} Maintainers, please try again`
        ),
        422
      );
    }
    if (!subrole) {
      return next(new HttpError("Didn't find the Subrole please file"), 422);
    }
    const userData = await User.find(
      { subrole: subrole },
      "-password -email -createdAt -updatedAt -__v"
    );
    if (!userData.length) {
      return res
        .status(201)
        .json({ message: `${subrole} Maintainers Unavailabel` });
    }
    res.status(200).json(userData);
  } catch (error) {
    return next(new HttpError(error));
  }
};

const getRoleBasedUsers = async (req, res, next) => {
  const { usersRole } = req.params;

  try {
    if (!usersRole) {
      return next(new HttpError("didn't get the user Role", 422));
    }
    const RolesData = await User.find({ role: usersRole })
      .select("-password")
      .sort({ createdAt: -1 });
    if (!RolesData.length) {
      return res.status(201).json(`No ${usersRole} users Found `);
    }
    res.status(200).json(RolesData);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// =====================UPDATE USER=======================//
// PROTECTED
// METHOD:PATCH
// API-END-POINT:api/user/edit-user

const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+(@gmail.com)$/gim;
    // const expTimestamp = 1707481653;
    // const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds

    // if (expTimestamp < currentTimestamp) {
    //   console.log('Token has expired');
    // } else {
    //   console.log('Token is still valid');
    // }
    const roles = ["admin", "superadmin"];
    if (!roles.includes(req.user.role)) {
      return next(new HttpError("Forbidden", 403));
    }
    const {
      username,
      email,
      newPassword,
      // currentPassword,
      confirmNewPassword,
      role,
      subrole,
    } = await req.body;
    if (!username || !email) {
      return next(new HttpError("Fill all the details", 422));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new HttpError("User not found.", 422));
    }

    const newEmail = await email.toLowerCase();

    if (!emailRegex.test(email)) {
      return next(new HttpError("Invalid Email", 422));
    }

    //    confirm if the new email id already exist
    const emailExist = await User.findOne({ email: newEmail });
    // we want to update other details with/without changing email

    if (emailExist && emailExist._id != userId) {
      return next(new HttpError("Email already Exists", 422));
    }

    // compare current password to db password
    // const validateUserPassword = await bcrypt.compare(
    //   currentPassword,
    //   user.password
    // );
    // if (!validateUserPassword) {
    //   return next(new HttpError("Invalid current password", 422));
    // }

    if (newPassword || confirmNewPassword) {
      // compare newpassword validation
      if (newPassword.trim().length < 8) {
        return next(
          new HttpError("Password should be at least 8 characters.", 422)
        );
      }
      // dcompare newpassword and confirmNewpassword
      if (newPassword !== confirmNewPassword) {
        return next(new HttpError("New Password doesn't Match", 422));
      }

      // hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedpass = await bcrypt.hash(newPassword, salt);

      const newPassInfo = await User.findByIdAndUpdate(
        userId,
        {
          username,
          email: newEmail,
          password: hashedpass,
          role: role,
          subrole,
        },
        { new: true }
      );

      return res.status(200).json(newPassInfo);
    }

    // update user info in database

    const newInfo = await User.findByIdAndUpdate(
      userId,
      { username, email: newEmail, role: role, subrole },
      { new: true }
    );
    res.status(200).json(newInfo);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// =====================DELETE USER=======================//
// PROTECTED
// METHOD:DELETE
// API-END-POINT:api/user/delete-user

const deleteUser = async (req, res, next) => {
  try {
    const { userId } = await req.params;
    console.log(req.user);
    const roles = ["admin", "superadmin"];
    if (!roles.includes(req.user.role)) {
      return next(new HttpError("Forbidden", 403));
    }
    const user = await User.findById(userId);
    if (!user) {
      return next(new HttpError("User un-available", 422));
    }
    // const userEmail = user.email;
    // const userTickets = await Ticket.find({ userId: user._id }).select(
    //   "ticketNo"
    // );
    // const deleteComments = userTickets.map(({ _id }) => {
    //   return _id;
    // });
    // const result = await Ticket.deleteMany({ userId: user._id });
    // const deletedComments = await Comments.deleteMany({
    //   ticketId: { $in: deleteComments },
    // });
    const deleteUser = await User.findByIdAndDelete(userId);

    res.status(201).json(`user ${deleteUser.username} Deleted Sucessfully`);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// =====================CHANGE USER PROFILE PICTURE=======================//
// PROTECTED
// METHOD:POST
// API-END-POINT:api/user/avator/change-profile
const changeProfile = async (req, res, next) => {
  const { userId } = await req.body;
  console.log(userId,"up prof");
  try {
    if (!userId) {
      return next(new HttpError("userId is Not Defined", 422));
    }
    if (!req.files.profile) {
      return next(new HttpError("Please choose an image", 422));
    }
    // find user from database
    const user = await User.findById(userId);
    if (user.profile) {
      fs.unlink(
        path.join(__dirname, "..", "uploads", "users-profile", user.profile),
        (err) => {
          if (err) {
            return next(new HttpError(err));
          }
        }
      );
    }

    const { profile } = req.files;
    //check files
    if (profile.size > 1000000) {
      return next(new HttpError("Profile picture Should be less than 1mb"));
    }

    let filename;
    filename = profile.name;
    const splittedName = filename.split(".");
    let newFilename =
      splittedName[0] + uuid() + "." + splittedName[splittedName.length - 1];
    profile.mv(
      path.join(__dirname, "..", "uploads", "users-profile", newFilename),
      async (err) => {
        if (err) {
          return next(new HttpError(err));
        }

        const updateProfile = await User.findByIdAndUpdate(
          userId,
          { profile: newFilename },
          { new: true }
        );
        if (!updateProfile) {
          return next(new HttpError("profile couldn't be changed", 422));
        }
        res.status(200).json(updateProfile);
      }
    );
  } catch (error) {
    return next(new HttpError(error));
  }
};

const addMaintainerRole = async (req, res, next) => {
  const { role } = req.body;
  if (!role) {
    return next(new HttpError("Please Enter Name of Role Before sumbit ", 422));
  }
  const duplicateMaintainer = await Maintainer.find({ role: role });
  if (duplicateMaintainer.length > 0) {
    return next(new HttpError(`${role} Role is Already Exists`, 422));
  }
  const maintainer = await Maintainer.create({ role: role });
  if (!maintainer) {
    return next(new HttpError("Something Went Wrong, Please Try again", 422));
  }
  res
    .status(200)
    .json(`new Maintainer Role : ${maintainer.role} added Succesfully`);
};

const getMaintainerRoles = async (req, res, next) => {
  const roles = await Maintainer.find();
  if (!roles) {
    return next(new HttpError("No maintainers roles Created yet", 422));
  }
  res.status(200).json(roles);
};

const deleteMaintainerRole = async (req, res, next) => {
  const { roleId } = req.params;
  if(!roleId){
    return next(new HttpError("please Check Role ID", 422));
  }
  const role = await Maintainer.findByIdAndDelete(roleId);
  if (!role) {
    return next(new HttpError("something went Wrong,Please Tryagain!", 422));
  }
  res.status(200).json(`${role.role} role is Deleted Successfully`);
};

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  getSingleUser,
  getSubroleUser,
  getRoleBasedUsers,
  updateUser,
  deleteUser,
  changeProfile,
  addMaintainerRole,
  getMaintainerRoles,
  deleteMaintainerRole
};
