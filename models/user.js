const Joi = require('joi');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('config');
const PasswordComplexity = require('joi-password-complexity');


const userSchema = new mongoose.Schema({
    name: {type: String, minLength: 3, maxLength: 50, required: true},
    email: {type: String, minLength: 5, maxLength: 50, required: true, unique: true},
    password: {type: String, minLength: 5, maxLength: 25, required: true}
});

userSchema.methods.generateAuthToken = function () {
    return jwt.sign({_id: this._id}, config.get('jwtPrivateKey'));
};

const User = mongoose.model("User", userSchema);
const PASSWORD_MIN = 5, PASSWORD_MAX = 25;

function validateUser(user) {
    const schema = {
        _id: Joi.string(),
        name: Joi.string().min(3).max(50).required(),
        email: Joi.string().min(5).max(50).required().email(),
        password: Joi.string().min(PASSWORD_MIN).max(PASSWORD_MAX).required()
    };

    return Joi.validate(user, schema);
}

function validatePassword(password){
    /*
        const defaultOptions = {
            min: 8,
            max: 26,
            lowerCase: 1,
            upperCase: 1,
            numeric: 1,
            symbol: 1
        };
    */

    const options = {
        min: PASSWORD_MIN,
        max: PASSWORD_MAX,
        lowerCase: 1,
        upperCase: 0,
        numeric: 1,
        symbol: 0
    };

    return Joi.validate(password, new PasswordComplexity(options));
}

exports.User = User;
exports.validate = validateUser;
exports.validatePassword = validatePassword;
exports.validateId = mongoose.Types.ObjectId.isValid;