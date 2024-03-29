const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(
  async (req, res, next) => {
    // 1) CREATE ERROR IF USER POST's PASSWORD DATA
    if (
      req.body.password ||
      req.body.passwordConfirm
    ) {
      return next(
        new AppError(
          'You cannot change your password using this route. Please use updateMyPassword',
          400,
        ),
      );
    }
    //2) FILTER OUT UNWANTED FIELD NAMES THAT ARE NOT ALLOWED TO BE UPDATED
    const filteredBody = filterObj(
      req.body,
      'name',
      'email',
    );

    //3) UPDATE USER DOCUMENT
    const updatedUser =
      await User.findByIdAndUpdate(
        req.user.id,
        filteredBody,
        { new: true, runValidators: true },
      );

    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: {
        updatedUser,
      },
    });
  },
);

exports.deleteMe = catchAsync(
  async (req, res, next) => {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { active: false },
    );
    res.status(204).json({
      staus: 'success',
      data: null,
    });
  },
);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'fail',
    message: 'Not Implemented',
  });
};

exports.getUser = factory.getOne(User);

exports.getAllUsers = factory.getAll(User);

// DO NOT UPDATE PASSWORD WITH THIS
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);
