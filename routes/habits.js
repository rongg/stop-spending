const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {User} = require('../models/user');
const {Habit, validation} = require('../models/habit');


//  GET  api/habits -- all habits for user
router.get('/', auth, async (req, res) => {
    const habits = await Habit.find({userId: req.user._id});

    res.send(habits);
});

// GET api/habits/:id -- single
router.get('/:id', auth, async (req, res) =>{
    if(!validation.checkId(req.params.id)){
        return res.status(400).send("Invalid Id");
    }
    const habit = await Habit.findById(req.params.id);
    if(habit){
        res.send(habit);
    }else{
        res.status(404).send("Not found");
    }
});

// POST api/habits -- create
router.post('/', auth, async(req, res) => {
    //  Validate body
    const vResult = validation.check(req.body);
    if(vResult.error){
        return res.status(400).send(vResult.error);
    }

    const habit = new Habit({
        userId: req.body.userId,
        name: req.body.name,
        budget: req.body.budget,
        icon: req.body.icon
    });

    const existingHabit = await Habit.findOne({name: req.body.name});
    if(existingHabit){
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
router.put('/:id', auth, async(req, res) => {
    //  Object Id validation
    if(!validation.checkId(req.params.id)){
        return res.status(400).send("Not found");
    }
    //  Input validation
    const vResult = validation.check(req.body);
    if(vResult.error){
        return res.status(400).send(vResult.error);
    }
    //  If not exists return 404
    const habit = await Habit.findById(req.params.id);
    if(!habit){
        return res.status(404).send("Habit not found");
    }

    //  Update and return modified
    habit.name = req.body.name;
    habit.budget = req.body.budget;
    habit.icon = req.body.icon;

    const result = await habit.save();

    res.status(200).send(result);
});

// DELETE api/habits/:id
router.delete('/:id', auth, async(req, res) => {
    if(!validation.checkId(req.params.id)){
        return res.status(400).send("Not found");
    }
    const habit = await Habit.findById(req.params.id);
    if(!habit){
        return res.status(404).send("Habit not found");
    }

    const result = await Habit.deleteOne({_id: req.params.id});

    res.status(200).send(result);
});


module.exports = router;