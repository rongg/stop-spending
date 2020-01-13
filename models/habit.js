const Joi = require('joi');
const mongoose = require('mongoose');

let maxLengthName = 50, minLengthName = 3;
const mHabitSchema = new mongoose.Schema({
    userId: {type: String, maxLength: 25, require: true},
    name: {type: String, required: true, minLength: minLengthName, maxLength: maxLengthName},
    budget: {type: Number, required: true, minValue: 1, maxValue: 1000000000},
    budgetType: {type: String, required: true, minLength: 1, maxLength: 25},
    icon: {type: String, maxLength: 255},
});

const Habit = mongoose.model('Habit', mHabitSchema);

const validation ={
    check: function(habit){
        const jHabitSchema = {
            _id: Joi.string(),
            userId: Joi.string().max(25).required(),
            name: Joi.string().min(minLengthName).max(maxLengthName).required(),
            budget: Joi.number().min(1).max(1000000000).required(),
            budgetType: Joi.string().min(1).max(25).required(),
            icon: Joi.string().max(255)
        };

        return Joi.validate(habit, jHabitSchema);
    },
    checkId: mongoose.Types.ObjectId.isValid
};

module.exports = {
    Habit: Habit,
    validation: validation
};