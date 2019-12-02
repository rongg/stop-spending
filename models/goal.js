const Joi = require('joi');
const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    userId: {type: String, maxLength: 25, require: true},
    start: {type: Date, require: true},
    end: {type: Date, require: true},
    habitId: {type: String, max: 25, require: true},
    type: {type: String, max: 25, require: true},
    name: {type: String, max: 25, require: true},
    period: {type: String, max: 25, require: true},
    target: {type: Number, require: true},
    pass: {type: Boolean, default: false},
    active: {type: Boolean, default: true}
});

const Goal = mongoose.model('Goal', goalSchema);

const validation = {
    check: function (goal) {
        const jGoalSchema = {
            _id: Joi.string(),
            userId: Joi.string().max(25).required(),
            start: Joi.date().required(),
            end: Joi.date().required(),
            habitId: Joi.string().max(25).required(),
            type: Joi.string().max(25).required(),
            name: Joi.string().max(25).required(),
            period: Joi.string().required(),
            target: Joi.number().required(),
            pass: Joi.boolean(),
            active: Joi.boolean(),
        };

        return Joi.validate(goal, jGoalSchema);
    },
    checkId: mongoose.Types.ObjectId.isValid
};

module.exports = {
    Goal,
    validation: validation
};
