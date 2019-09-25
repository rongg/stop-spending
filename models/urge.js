const Joi = require('joi');
const mongoose = require('mongoose');

const urgeSchema = new mongoose.Schema({
    userId: {type: String, maxLength: 25, require: true},
    date: {type: Date, default: Date.now},
    habitId: {type: String, max: 25, require: true}
});

const Urge = mongoose.model('Urge', urgeSchema);

const validation = {
    check: function (urge) {
        const jUrgeSchema = {
            _id: Joi.string(),
            userId: Joi.string().max(25).required(),
            date: Joi.date(),
            habitId: Joi.string().max(25).required()
        };

        return Joi.validate(urge, jUrgeSchema);
    },
    checkId: mongoose.Types.ObjectId.isValid
};

module.exports = {
    Urge,
    validation: validation
};
