const Joi = require('joi');
const mongoose = require('mongoose');

let maxLengthName = 50, minLengthName = 3;
const expenseSchema = new mongoose.Schema({
    userId: {type: String, maxLength: 25, require: true},
    name: {type: String, required: true, minLength: minLengthName, maxLength: maxLengthName},
    amount: {type: Number, required: true, min: 1, max: 1000000000},
    date: {type: Date, default: Date.now},
    habitId: {type: String, max: 25},
});

const Expense = mongoose.model('Expense', expenseSchema);

const validation = {
    check: function (expense) {
        const jExpenseSchema = {
            _id: Joi.string(),
            userId: Joi.string().max(25).required(),
            name: Joi.string().min(minLengthName).max(maxLengthName).required(),
            amount: Joi.number().integer().min(1).max(1000000000).required(),
            date: Joi.date(),
            habitId: Joi.string().max(25).allow(''),
        };

        return Joi.validate(expense, jExpenseSchema);
    },
    checkId: mongoose.Types.ObjectId.isValid
};

module.exports = {
    Expense: Expense,
    validation: validation
};
