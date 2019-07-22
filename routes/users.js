const _ = require('lodash');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const sgMail = require('@sendgrid/mail');
const {validate, User, validateId, validatePassword, generateVerificationToken, validateEmail} = require('../models/user');

const {VerifyToken} = require('../models/verify_token');

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
    if (cResult.error) return res.status(400).send(cResult.error);

    //  Make sure not registered already
    let user = await User.findOne({email: req.body.email});
    if (user) return res.status(400).send('User already registered.');

    //  Save to mongo
    user = new User(_.pick(req.body, ['name', 'email', 'password']));
    user.isVerified = false;

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();

    /*  Email confirmation */
    const verifyToken = new VerifyToken({_userId: user._id, token: generateVerificationToken()});
    await verifyToken.save();

    // Send the email
    // using Twilio SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const confirmUrl = "https://stop-spending-app.herokuapp.com/account/verify/" + verifyToken.token;
    const msg = {
        to: req.body.email,
        from: 'ronald.gayda.jr@gmail.com',
        subject: 'Your Account Has Been Created',
        text: 'Hi, ' + user.name + '. Welcome to Stop Spending. Please confirm your account below.',
        html: '<a href="' + confirmUrl + '">Verify</a>',
    };
    //  Don't send when testing
    if (process.env.NODE_ENV === 'production') sgMail.send(msg);

    const token = user.generateAuthToken();

    res.header('x-auth-token', token).status(200).send(_.pick(user, ['_id', 'name', 'email']));
});

// GET api/users/verify/:token
router.post('/verify/:token', async (req, res) => {
    // Find a matching token
    const verifyToken = await VerifyToken.findOne({token: req.params.token});

    if (!verifyToken) return res.status(400).send({
        result: 'not-verified',
        msg: 'We were unable to find a valid token. Your token may have expired.'
    });

    // If we found a token, find a matching user
    const user = await User.findById(verifyToken._userId);
    if (!user) return res.status(400).send({msg: 'We were unable to find a user for this token.'});

    if (user.isVerified) return res.status(400).send({
        result: 'already-verified',
        msg: 'This user has already been verified.'
    });

    // Verify and save the user
    user.isVerified = true;
    await user.save();

    res.status(200).send(_.pick(user, ['_id', 'name', 'email', 'isVerified']));
});

// // POST api/users/resend/verification
router.post('/resend/verification', auth, async (req, res) => {
    /*  Email confirmation */
    const user = req.user;
    const verifyToken = new VerifyToken({_userId: user._id, token: generateVerificationToken()});
    await verifyToken.save();

    // Send the email
    // using Twilio SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const confirmUrl = "https://stop-spending-app.herokuapp.com/account/verify/" + verifyToken.token;
    const msg = {
        to: user.email,
        from: 'ronald.gayda.jr@gmail.com',
        subject: 'Account Verification',
        text: 'Hi, ' + user.name + '. Welcome to Stop Spending. Please confirm your account below.',
        html: '<a href="' + confirmUrl + '">Verify</a>',
    };
    //  Don't send when testing
    if (process.env.NODE_ENV === 'production') sgMail.send(msg);

    res.status(200).send('An email has been sent to ' + user.email);
});

// // POST api/users/reset/password
router.post('/reset/password', async (req, res) => {
    const cResult = validateEmail(req.body.email);
    if (cResult.error) return res.status(400).send(cResult.error);

    const user = await User.findOne({email: req.body.email});

    if (!user) return res.status(400).send('No account for email provided.');

    const verifyToken = new VerifyToken({_userId: user._id, token: generateVerificationToken()});
    await verifyToken.save();

    // Send the email
    // using Twilio SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const confirmUrl = "https://stop-spending-app.herokuapp.com/account/" + user._id + "/reset/password/" + verifyToken.token;
    const msg = {
        to: user.email,
        from: 'ronald.gayda.jr@gmail.com',
        subject: 'Reset your password',
        text: 'Hi, ' + user.name + '. Please use the link below to reset your password.',
        html: '<a href="' + confirmUrl + '">Reset Password</a>',
    };
    //  Don't send when testing
    if (process.env.NODE_ENV === 'production') sgMail.send(msg);

    res.status(200).send('An email has been sent to ' + user.email);
});

// // POST api/users/:id/reset/password/:token
router.post('/reset/password/:token', async (req, res) => {
    // Find a matching token
    const verifyToken = await VerifyToken.findOne({token: req.params.token});

    if (!verifyToken) return res.status(400).send({
        result: 'not-verified',
        msg: 'We were unable to find a valid token. Your token may have expired.'
    });

    const cResult = validatePassword(req.body.password);
    if (cResult.error) return res.status(400).send(cResult.error);

    const user = await User.findById(req.body.userId);

    if (!user) return res.status(400).send('User does not exist.');

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    await user.save();

    await verifyToken.delete();

    res.status(200).send('Your password has been reset! Please log in.');
});

// PUT api/users/:id -- update a user
router.put('/:id', auth, async (req, res) => {
    if (!validateId(req.params.id)) {
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

    const result = await user.save();

    res.status(200).send(result);
});

// DELETE api/users/:id -- delete a user account
router.delete('/:id', auth, async (req, res) => {
    if (!validateId(req.params.id)) {
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