const Joi = require('joi');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('config');


const userSchema = new mongoose.Schema({
    name: {type: String, minLength: 3, maxLength: 50, required: true},
    email: {type: String, minLength: 5, maxLength: 255, required: true, unique: true},
    password: {type: String, minLength: 5, maxLength: 1024, required: true}
});

userSchema.methods.generateAuthToken = function () {
    return jwt.sign({_id: this._id}, config.get('jwtPrivateKey'));
};

const User = mongoose.model("User", userSchema);

//  Validate the request body
function validateUser(user) {
    const schema = {
        _id: Joi.string(),
        name: Joi.string().min(3).max(50).required(),
        email: Joi.string().min(5).max(255).required().email(),
        password: Joi.string().min(5).max(255).required()
    };

    return Joi.validate(user, schema);
}

exports.User = User;
exports.validate = validateUser;
exports.validateId = mongoose.Types.ObjectId.isValid;