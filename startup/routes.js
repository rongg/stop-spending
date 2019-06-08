const habits = require('../routes/habits');
const expenses = require('../routes/expenses');
const users = require('../routes/users');
const auth = require('../routes/auth');
const error = require('../middleware/error');
const path = require('path');
const express = require('express');
const cors = require('cors');

module.exports = function(app){
    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(error);
    app.use(cors());
    app.use('/api/habits', habits);
    app.use('/api/expenses', expenses);
    app.use('/api/users', users);
    app.use('/api/auth', auth);
};