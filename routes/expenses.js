const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {Habit} = require('../models/habit');
const {User} = require('../models/user');
const {Expense, validation} = require('../models/expense');


//  GET  api/expenses -- get user expenses w/ specified filters
router.get('/', auth, async (req, res) => {
    let query = {userId: req.user._id};

    if(req.query.habitId) query.habitId = req.query.habitId;    //  filter by habit

    const expenses = await Expense.find(query);
    res.status(200).send(expenses);
});

// GET api/expenses/:id -- get a single expense
router.get('/:id', auth, async (req, res) => {
    if (!validation.checkId(req.params.id)) {
        res.status(400).send("Invalid Id");
        return;
    }
    const expense = await Expense.findById(req.params.id);
    if (expense) {
        res.send(expense);
    } else {
        res.status(404).send("Not found");
    }
});

// POST api/expenses -- create
router.post('/', auth, async (req, res) => {
    //  Validate body
    if (!validation.checkId(req.body.habitId)) {
        return res.status(400).send("Invalid Habit Id");
    }
    const vResult = validation.check(req.body);
    if (vResult.error) {
        return res.status(400).send(vResult.error);
    }
    //  Check habit exists
    const habit = await Habit.findById(req.body.habitId);
    if (!habit) {
        return res.status(404).send("Habit not found for Id");
    }
    //  Check user exists
    const user = await User.findById(req.body.userId);
    if (!user) {
        return res.status(400).send("User doesn't exist");
    }

    const expense = new Expense({
        userId: req.body.userId,
        name: req.body.name,
        amount: req.body.amount,
        habitId: req.body.habitId
    });

    const result = await expense.save();

    res.status(200).send(result);
});

// PUT api/expense/:id -- update
router.put('/:id', auth, async (req, res) => {
    if (!validation.checkId(req.params.id)) {
        res.status(400).send("Not found");
        return;
    }
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
        res.status(404).send("Expense not found");
        return;
    }
    //  Validate input or return 400
    const vResult = validation.check(req.body);
    if (vResult.error) {
        res.status(400).send(vResult.error);
        return;
    }
    //  Check habit exists
    if (!validation.checkId(req.body.habitId)) {
        res.status(400).send("Invalid Habit Id");
        return;
    }
    const habit = await Habit.findById(req.body.habitId);
    if (!habit) {
        res.status(404).send("Habit not found for Id");
        return;
    }
    //  Update and return modified
    expense.name = req.body.name;
    expense.amount = req.body.amount;
    expense.date = req.body.date;
    expense.habitId = req.body.habitId;

    const result = await expense.save();

    res.status(200).send(result);
});

// DELETE api/expenses/:id
router.delete('/:id', auth, async (req, res) => {
    if (!validation.checkId(req.params.id)) {
        res.status(400).send("Not found");
        return;
    }
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
        res.status(404).send("Expense not found");
        return;
    }

    const result = await Expense.deleteOne({_id: req.params.id});

    res.status(200).send(result);
});


module.exports = router;