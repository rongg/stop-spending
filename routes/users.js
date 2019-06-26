const _ = require('lodash');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const {validate, User, validateId, validatePassword} = require('../models/user');

//  GET api/users/me -- get the current user using auth token
router.get('/me', auth, async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    res.send(user);
});

//  POST api/users -- create a new user
router.post('/', async (req, res) => {
    //  Validate request body
    const vResult = validate(req.body);
    if (vResult.error) return res.status(400).send(vResult.error);
    //  Validate password complexity
    const cResult = validatePassword(req.body.password);
    if(cResult.error) return res.status(400).send(cResult.error);

    //  Make sure not registered already
    let user = await User.findOne({email: req.body.email});
    if (user) return res.status(400).send('User already registered.');

    //  Save to mongo
    user = new User(_.pick(req.body, ['name', 'email', 'password']));
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();


    const token = user.generateAuthToken();

    res.header('x-auth-token', token).status(200).send(_.pick(user, ['_id', 'name', 'email']));
});

// PUT api/users/:id -- update a user
router.put('/:id', auth, async (req, res) => {
    if(!validateId(req.params.id)){
        return res.status(400).send("Not found");
    }
    //  Input validation
    const vResult = validate(req.body);
    if (vResult.error) {
        return res.status(400).send(vResult.error);
    }
    //  If not exists return 404
    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).send("User not found");
    }
    //  Update and return modified
    user.name = req.body.name;
    user.email = req.body.email;

    const result = await user.save();

    res.status(200).send(result);
});

// DELETE api/users/:id -- delete a user account
router.delete('/:id', auth, async (req, res) => {
    if(!validateId(req.params.id)){
        return res.status(400).send("Not found");
    }
    //  If not exists return 404
    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).send("User not found");
    }

    const result = await User.deleteOne({_id: req.params.id});

    res.status(200).send(result);
});

module.exports = router;