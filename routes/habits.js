const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {User} = require('../models/user');
const {Expense} = require('../models/expense');
const {Urge, validation: urgeValidation} = require('../models/urge');
const {Habit, validation} = require('../models/habit');


//  GET  api/habits -- all habits for user
router.get('/', auth, async (req, res) => {
    const habits = await Habit.find({userId: req.user._id});

    res.send(habits);
});

// GET api/habits/:id -- single
router.get('/:id', auth, async (req, res) => {
    if (!validation.checkId(req.params.id)) {
        return res.status(400).send("Invalid Id");
    }
    const habit = await Habit.findById(req.params.id);
    if (habit) {
        res.send(habit);
    } else {
        res.status(404).send("Not found");
    }
});

// POST api/habits -- create
router.post('/', auth, async (req, res) => {
    //  Validate body
    const vResult = validation.check(req.body);
    if (vResult.error) {
        return res.status(400).send(vResult.error);
    }

    const habit = new Habit({
        userId: req.body.userId,
        name: req.body.name,
        budget: req.body.budget,
        budgetType: req.body.budgetType,
        icon: req.body.icon
    });

    const existingHabit = await Habit.findOne({userId: habit.userId, name: req.body.name});
    if (existingHabit) {
        return res.status(400).send(`A habit with the name "${habit.name}" already exists!`);
    }

    //  Check user exists
    const user = await User.findById(habit.userId);
    if (!user) {
        return res.status(400).send("User doesn't exist");
    }

    const result = await habit.save();

    res.status(200).send(result);
});

// PUT api/habits/:id -- update
router.put('/:id', auth, async (req, res) => {
    //  Object Id validation
    if (!validation.checkId(req.params.id)) {
        return res.status(400).send("Not found");
    }
    //  Input validation
    const vResult = validation.check(req.body);
    if (vResult.error) {
        return res.status(400).send(vResult.error);
    }
    //  If not exists return 404
    const habit = await Habit.findById(req.params.id);
    if (!habit) {
        return res.status(404).send("Habit not found");
    }

    //  Update and return modified
    habit.name = req.body.name;
    habit.budget = req.body.budget;
    habit.budgetType = req.body.budgetType;
    habit.icon = req.body.icon;

    const result = await habit.save();

    res.status(200).send(result);
});

// DELETE api/habits/:id
router.delete('/:id', auth, async (req, res) => {
    let habitId = req.params.id;
    if (!validation.checkId(habitId)) {
        return res.status(400).send("Not found");
    }
    const habit = await Habit.findById(habitId);
    if (!habit) {
        return res.status(404).send("Habit not found");
    }

    const result = await Habit.deleteOne({_id: habitId});

    //  Set expense habitId's to null
    await Expense.updateMany({habitId}, {habitId: ''});

    res.status(200).send(result);
});

// GET api/habits/:id/urges --  Urges for single habit
router.get('/:id/urges', auth, async (req, res) => {
    let query = {userId: req.user._id};
    let habitId = req.params.id;
    if (!validation.checkId(habitId)) {
        return res.status(400).send("Not found");
    }
    const habit = await Habit.findById(habitId);
    if (!habit) {
        return res.status(404).send("Habit not found");
    }

    if (req.query.start && req.query.end) {
        query.date = {$gte: req.query.start, $lte: req.query.end};
    } else {
        return res.status(400).send('Start and end date is required.');
    }

    query.habitId = habitId;

    const urges = await Urge.find(query);

    res.status(200).send(urges);
});

// GET api/habits/urges --  All urges for a user
router.get('/urges/all', auth, async (req, res) => {
    let query = {userId: req.user._id};

    if (req.query.start && req.query.end) {
        query.date = {$gte: req.query.start, $lte: req.query.end};
    } else {
        return res.status(400).send('Start and end date is required.');
    }

    const urges = await Urge.find(query);

    res.status(200).send(urges);
});

// POST api/habits/:id/urge
router.post('/:id/urge', auth, async(req, res) => {
    const vResult = urgeValidation.check(req.body);
    if (vResult.error) {
        return res.status(400).send(vResult.error);
    }

    const urge = new Urge({
        date: req.body.date,
        habitId: req.body.habitId,
        userId: req.body.userId
    });

    const result = await urge.save();

    res.status(200).send(result);
});


module.exports = router;