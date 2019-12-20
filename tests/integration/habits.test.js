const request = require('supertest');
const {Habit} = require('../../models/habit');
const {User} = require('../../models/user');
const {Expense} = require('../../models/expense');
const {Urge} = require('../../models/urge');
const {Goal} = require('../../models/goal');
const mongoose = require('mongoose');

let server;

describe('api/habits', () => {
    let user, token;
    beforeEach(async () => {
        server = require('../../index');
        //  Authenticate user
        user = new User({
            _id: new mongoose.Types.ObjectId().toHexString(),
            name: 'Test User',
            email: 'test.user@mail.com',
            password: '12345'
        });
        token = user.generateAuthToken();
        await user.save();
    });
    afterEach(async () => {
        await Habit.deleteMany({});
        await User.deleteMany({});
        await Urge.deleteMany({});
        await Goal.deleteMany({});
        server.close();
    });

    describe('GET /', () => {
        it('should require authorization', async () => {
            const res = await request(server).get('/api/habits');
            expect(res.status).toBe(401);
        });
        it('should return all habits for a user', async () => {
            const habit1 = new Habit({
                userId: user._id,
                _id: new mongoose.Types.ObjectId().toHexString(),
                name: 'Habit 1',
                budget: 50,
                budgetType: 'week',
                icon: 'www.icons.com/1'
            });
            await habit1.save();

            const habit2 = new Habit({
                userId: user._id,
                _id: new mongoose.Types.ObjectId().toHexString(),
                name: 'Habit 2',
                budget: 99,
                budgetType: 'week',
                icon: 'www.icons.com/2'
            });
            await habit2.save();

            const res = await request(server)
                .get('/api/habits')
                .set('Accept', 'application/json')
                .set('x-auth-token', token);

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body[0]._id.toString()).toMatch(habit1._id.toString());
            expect(res.body[0].name).toMatch(habit1.name);
            expect(res.body[0].icon).toMatch(habit1.icon);
            expect(res.body[0].userId).toMatch(habit1.userId);

            expect(res.body[1]._id.toString()).toMatch(habit2._id.toString());
            expect(res.body[1].name).toMatch(habit2.name);
            expect(res.body[1].icon).toMatch(habit2.icon);
            expect(res.body[1].userId).toMatch(habit2.userId);

        });
    });

    describe('GET /:id', () => {
        it('should require authorization', async () => {
            const res = await request(server).get('/api/habits');
            expect(res.status).toBe(401);
        });
        it('should get a single habit', async () => {
            const habit = new Habit({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                name: 'New Habit',
                budget: 1000,
                budgetType: 'week',
                icon: 'www.icons.com/new_habit'
            });
            await habit.save();

            const res = await request(server)
                .get(`/api/habits/${habit._id}`)
                .set('Accept', 'application/json')
                .set('x-auth-token', token);

            expect(res.status).toBe(200);
            expect(res.body._id).toMatch(habit._id.toString());
            expect(res.body.name).toMatch(habit.name);
            expect(res.body.icon).toMatch(habit.icon);
            expect(res.body.userId).toMatch(habit.userId);
        });
    });

    describe('POST /', () => {
        it('should require authorization', async () => {
            const res = await request(server).post('/api/habits');
            expect(res.status).toBe(401);
        });

        it('should not create a habit if it is invalid', async () => {
            const habit = new Habit({
                name: "Habit missing user id",
                budget: 100,
                budgetType: 'week',
                icon: "icons.com"
            });
            const res = await request(server)
                .post("/api/habits")
                .send(habit)
                .set("x-auth-token", token)
                .set("Accept", "application/json");


            expect(res.body.details[0].message).toBe('"userId" is required');
            expect(res.status).toBe(400);
        });

        it(`should reject creating a habit if it's name already exists for that user`, async () => {
            const habit = new Habit({
                name: "Duplicate habit",
                userId: user._id,
                budget: 100,
                budgetType: 'week',
                icon: "icons.com"
            });

            await request(server)
                .post("/api/habits")
                .send(habit)
                .set("x-auth-token", token)
                .set("Accept", "application/json");
            const res = await request(server)   //  Insert again
                .post("/api/habits")
                .send(habit)
                .set("x-auth-token", token)
                .set("Accept", "application/json");

            expect(res.status).toBe(400);
            expect(res.text).toBe(`A habit with the name "${habit.name}" already exists!`);
        });

        it('should check that the user exists', async () => {
            const habit = new Habit({
                name: "Habit A",
                userId: new mongoose.Types.ObjectId(),
                budget: 100,
                budgetType: 'week',
                icon: "icons.com"
            });

            const res = await request(server)   //  Insert again
                .post("/api/habits")
                .send(habit)
                .set("x-auth-token", token)
                .set("Accept", "application/json");


            expect(res.status).toBe(400);
            expect(res.text).toBe("User doesn't exist");
        });

        it('should create a new habit', async () => {
            const habit = new Habit({
                name: "New Habit",
                userId: user._id,
                budget: 2000,
                budgetType: 'week',
                icon: "icons.com"
            });
            const res = await request(server)
                .post("/api/habits")
                .send(habit)
                .set("x-auth-token", token)
                .set("Accept", "application/json");

            expect(res.status).toBe(200);
            expect(res.body.name).toMatch(habit.name);
        });
    });

    describe('PUT /:id', () => {
        it('should require authorization', async () => {
            const res = await request(server).put('/api/habits/123');
            expect(res.status).toBe(401);
        });
        it('should validate the object id and return generic error message', async () => {
            const res = await request(server)
                .put("/api/habits/1234")   //  invalid id
                .set("x-auth-token", token);

            expect(res.status).toBe(400);
            expect(res.text).toBe("Not found");
        });
        it('should reject an invalid habit', async () => {
            const habit = new Habit({
                name: "New Habit",
                userId: user._id,
                budget: 2000,
                budgetType: 'week',
                icon: "icons.com"
            });
            const res1 = await request(server)
                .post("/api/habits")
                .send(habit)
                .set("x-auth-token", token)
                .set("Accept", "application/json");

            habit.budget = 0;   //  Invalid range

            const res2 = await request(server)
                .put("/api/habits/" + res1.body._id)
                .send(habit)
                .set("x-auth-token", token)
                .set("Accept", "application/json");


            expect(res2.body.details[0].message).toBe('"budget" must be larger than or equal to 1');
            expect(res2.status).toBe(400);
        });
        it('should make sure the habit exists', async () => {
            const habit = new Habit({
                name: "New Habit",
                userId: user._id,
                budget: 2000,
                budgetType: 'week',
                icon: "icons.com"
            });
            const res = await request(server)
                .put("/api/habits/" + new mongoose.Types.ObjectId())
                .send(habit)
                .set("x-auth-token", token)
                .set("Accept", "application/json");

            expect(res.status).toBe(404);
            expect(res.text).toBe('Habit not found')
        });
        it('should update the habit', async () => {
            const habit = new Habit({
                name: "New Habit",
                userId: user._id,
                budget: 2000,
                budgetType: 'week',
                icon: "icons.com"
            });
            const res1 = await request(server)
                .post("/api/habits")
                .send(habit)
                .set("x-auth-token", token)
                .set("Accept", "application/json");

            habit.name = "Updated Habit";
            habit.budget = 1999;
            habit.budgetType = 'month';
            habit.icon = "icons.com/1";

            const res2 = await request(server)
                .put("/api/habits/" + res1.body._id)
                .send(habit)
                .set("x-auth-token", token)
                .set("Accept", "application/json");

            expect(res2.status).toBe(200);
            expect(res2.body.name).toBe(habit.name);
            expect(res2.body.budget).toBe(habit.budget);
            expect(res2.body.budgetType).toBe(habit.budgetType);
            expect(res2.body.icon).toBe(habit.icon);
        });
    });

    describe('DELETE /:id', () => {
        it('should require authorization', async () => {
            const res = await request(server).delete('/api/habits/123');
            expect(res.status).toBe(401);
        });

        it('should validate the object id and return a generic error message', async () => {
            const res = await request(server)
                .delete("/api/habits/1234")   //  invalid id
                .set("x-auth-token", token);

            expect(res.status).toBe(400);
            expect(res.text).toBe("Not found");
        });

        it('should make sure the habit exists', async () => {
            const habit = new Habit({
                name: "New Habit",
                userId: user._id,
                budget: 2000,
                budgetType: 'week',
                icon: "icons.com"
            });
            const res = await request(server)
                .delete("/api/habits/" + new mongoose.Types.ObjectId())
                .send(habit)
                .set("x-auth-token", token)
                .set("Accept", "application/json");

            expect(res.status).toBe(404);
            expect(res.text).toBe('Habit not found')
        });

        it(`should delete the habit and set all it's expenses habitId to be an empty string`, async () => {
            const habit = new Habit({
                name: "New Habit",
                userId: user._id,
                budget: 2000,
                budgetType: 'week',
                icon: "icons.com"
            });

            const res1 = await request(server)
                .post("/api/habits")
                .send(habit)
                .set("x-auth-token", token)
                .set("Accept", "application/json");

            const habitId = res1.body._id;
            const expense1 = new Expense({
                userId: user._id,
                name: "Expense 1",
                amount: 100,
                date: new Date(),
                habitId: habitId,
                needWant: 'want'
            });
            const expense2 = new Expense({
                userId: user._id,
                name: "Expense 2",
                amount: 50,
                date: new Date(),
                habitId: habitId,
                needWant: 'want'
            });

            await expense1.save();
            await expense2.save();

            const res2 = await request(server)
                .delete("/api/habits/" + habitId)
                .set("x-auth-token", token)
                .set("Accept", "application/json");


            const expense1Updated = await Expense.findById(expense1._id);
            const expense2Updated = await Expense.findById(expense2._id);

            expect(res2.status).toBe(200);
            expect(res2.body.deletedCount).toBe(1);
            expect(expense1Updated.habitId).toBe('');
            expect(expense2Updated.habitId).toBe('');
        });
    });


    describe('GET /:id/urges', () => {
        it('should require authorization', async () => {
            const res = await request(server).get('/api/habits/12345/urges');
            expect(res.status).toBe(401);
        });
        it('should get all urges for a habit in a time period', async () => {
            const habit = new Habit({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                name: 'New Habit',
                budget: 1000,
                budgetType: 'week',
                icon: 'www.icons.com/new_habit'
            });
            await habit.save();

            const urge1 = new Urge({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                date: new Date(),
                habitId: habit._id
            });
            const urge2 = new Urge({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                date: new Date(),
                habitId: habit._id
            });


            const start = new Date();
            const end = new Date();
            start.setDate(start.getDate() - 1);
            end.setDate(end.getDate() + 1);

            const urge3 = new Urge({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                date: new Date().setDate(start.getDate() - 10),
                habitId: habit._id
            });

            await urge1.save();
            await urge2.save();
            await urge3.save();

            const res0 = await request(server)
                .get(`/api/habits/${habit._id}/urges`)
                .set('Accept', 'application/json')
                .set('x-auth-token', token);

            expect(res0.status).toBe(400);
            expect(res0.text).toBe('Start and end date is required.');

            const query = `?start=` + start + '&end=' + end;

            const res = await request(server)
                .get(`/api/habits/${habit._id}/urges` + query)
                .set('Accept', 'application/json')
                .set('x-auth-token', token);

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);

            expect(res.body[0]._id).toMatch(urge1._id.toString());
            expect(res.body[0].userId).toMatch(urge1.userId);

            expect(res.body[1]._id).toMatch(urge2._id.toString());
            expect(res.body[1].userId).toMatch(urge2.userId);
        });

    });

    describe('GET /urges/all', () => {
        it('should require authorization', async () => {
            const res = await request(server).get('/api/habits/urges/all');
            expect(res.status).toBe(401);

        });
        it('should get all urges for a user in a time period', async () => {
            const habit = new Habit({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                name: 'New Habit',
                budget: 1000,
                budgetType: 'week',
                icon: 'www.icons.com/new_habit'
            });
            await habit.save();

            const urge1 = new Urge({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                date: new Date(),
                habitId: habit._id
            });
            const urge2 = new Urge({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                date: new Date(),
                habitId: habit._id
            });


            const start = new Date();
            const end = new Date();
            start.setDate(start.getDate() - 1);
            end.setDate(end.getDate() + 1);

            const urge3 = new Urge({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                date: new Date().setDate(start.getDate() - 10),
                habitId: habit._id
            });
            const urge4 = new Urge({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: '12345',
                date: new Date().setDate(start.getDate() - 10),
                habitId: habit._id
            });

            await urge1.save(); //  good
            await urge2.save(); //  good
            await urge3.save(); //  out of date range
            await urge4.save(); //  different user

            const res0 = await request(server)
                .get(`/api/habits/urges/all`)
                .set('Accept', 'application/json')
                .set('x-auth-token', token);

            expect(res0.status).toBe(400);
            expect(res0.text).toBe('Start and end date is required.');

            const query = `?start=` + start + '&end=' + end;

            const res = await request(server)
                .get(`/api/habits/urges/all` + query)
                .set('Accept', 'application/json')
                .set('x-auth-token', token);

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);

            expect(res.body[0]._id).toMatch(urge1._id.toString());
            expect(res.body[0].userId).toMatch(urge1.userId);

            expect(res.body[1]._id).toMatch(urge2._id.toString());
            expect(res.body[1].userId).toMatch(urge2.userId);
        });
    });

    describe('POST /:id/urge', () => {
        it('should require authorization', async () => {
            const res = await request(server).post('/api/habits');
            expect(res.status).toBe(401);
        });
        //
        it('should not create an urge if it is invalid', async () => {
            const urge = new Urge({ //  Missing req habitId
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                date: new Date()
            });

            const habitId = new mongoose.Types.ObjectId().toHexString();

            const res = await request(server)
                .post("/api/habits/" + habitId + "/urge")
                .send(urge)
                .set("x-auth-token", token)
                .set("Accept", "application/json");


            expect(res.body.details[0].message).toBe('"habitId" is required');

            expect(res.status).toBe(400);
        });


        it('should create a new urge', async () => {
            const habit = new Habit({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                name: 'New Habit',
                budget: 1000,
                budgetType: 'week',
                icon: 'www.icons.com/new_habit'
            });
            await habit.save();

            const reqBody = {
                userId: user._id,
                date: new Date(),
                habitId: habit._id
            };

            const res = await request(server)
                .post("/api/habits/" + habit._id + '/urge')
                .send(reqBody)
                .set("x-auth-token", token)
                .set("Accept", "application/json");

            expect(res.status).toBe(200);
            expect(res.body.userId).toMatch(reqBody.userId.toString());
            expect(res.body.habitId).toMatch(reqBody.habitId.toString());
        });
    });

    describe('GET /:id/goals', () => {
        it('should require authorization', async () => {
            const res = await request(server).get('/api/habits/12345/goals');
            expect(res.status).toBe(401);
        });
        it('should get all active goals for a habit', async () => {
            const habit = new Habit({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                name: 'New Habit',
                budget: 1000,
                budgetType: 'week',
                icon: 'www.icons.com/new_habit'
            });
            await habit.save();

            const goal1 = new Goal({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                start: new Date(),
                end: new Date(),
                habitId: habit._id,
                type: 'micro_budget',
                pass: false,
                active: true
            });

            const goal2 = new Goal({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                start: new Date(),
                end: new Date(),
                habitId: habit._id,
                type: 'micro_budget',
                pass: false,
                active: true
            });

            const goal3 = new Goal({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                start: new Date(),
                end: new Date(),
                habitId: new mongoose.Types.ObjectId().toHexString(),
                type: 'micro_budget',
                pass: true,
                active: false
            });

            await goal1.save(); //  active
            await goal2.save(); //  active
            await goal3.save(); //  inactive

            const query = '?active=true';

            const res = await request(server)
                .get(`/api/habits/${habit._id}/goals` + query)
                .set('Accept', 'application/json')
                .set('x-auth-token', token);

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);

            expect(res.body[0]._id).toMatch(goal1._id.toString());
            expect(res.body[0].userId).toMatch(goal1.userId);

            expect(res.body[1]._id).toMatch(goal2._id.toString());
            expect(res.body[1].userId).toMatch(goal2.userId);
        });
        it('should get all goals for a habit in a time period', async () => {
            const habit = new Habit({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                name: 'New Habit',
                budget: 1000,
                budgetType: 'week',
                icon: 'www.icons.com/new_habit'
            });
            await habit.save();

            const goal1 = new Goal({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                start: new Date(),
                end: new Date(),
                habitId: habit._id,
                type: 'micro_budget',
                pass: false,
                active: true
            });

            const goal2 = new Goal({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                start: new Date(),
                end: new Date(),
                habitId: habit._id,
                type: 'micro_budget',
                pass: false,
                active: true
            });


            const start = new Date();
            const end = new Date();
            start.setDate(start.getDate() - 1);
            end.setDate(end.getDate() + 1);

            const goal3 = new Goal({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                start: new Date(),
                end: new Date().setDate(end.getDate() + 10),
                habitId: new mongoose.Types.ObjectId().toHexString(),
                type: 'micro_budget',
                pass: false,
                active: true
            });

            await goal1.save();
            await goal2.save();
            await goal3.save();

            const query = `?start=` + start + '&end=' + end;

            const res = await request(server)
                .get(`/api/habits/${habit._id}/goals` + query)
                .set('Accept', 'application/json')
                .set('x-auth-token', token);

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);

            expect(res.body[0]._id).toMatch(goal1._id.toString());
            expect(res.body[0].userId).toMatch(goal1.userId);

            expect(res.body[1]._id).toMatch(goal2._id.toString());
            expect(res.body[1].userId).toMatch(goal2.userId);
        });

    });

    describe('GET /goal/:id', () => {
        it('should require authorization', async () => {
            const res = await request(server).get('/api/habits/12345/goals');
            expect(res.status).toBe(401);
        });
        it(`should get a single goal using it's id`, async () => {
            const habit = new Habit({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                name: 'New Habit',
                budget: 1000,
                budgetType: 'week',
                icon: 'www.icons.com/new_habit'
            });
            await habit.save();

            const goal1 = new Goal({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                start: new Date(),
                end: new Date(),
                habitId: habit._id,
                type: 'micro_budget',
                pass: false,
                active: true
            });

            await goal1.save();

            const res = await request(server)
                .get(`/api/habits/goal/` + goal1._id)
                .set('Accept', 'application/json')
                .set('x-auth-token', token);

            expect(res.status).toBe(200);

            expect(res.body._id).toMatch(goal1._id.toString());
            expect(res.body.userId).toMatch(goal1.userId);

        });

    });

    describe('GET /goals/all', () => {
        it('should require authorization', async () => {
            const res = await request(server).get('/api/habits/goals/all');
            expect(res.status).toBe(401);
        });
        it('should get all active goals for a user', async () => {
            const habit = new Habit({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                name: 'New Habit',
                budget: 1000,
                budgetType: 'week',
                icon: 'www.icons.com/new_habit'
            });
            await habit.save();

            const goal1 = new Goal({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                start: new Date(),
                end: new Date(),
                habitId: habit._id,
                type: 'micro_budget',
                pass: false,
                active: true
            });

            const goal2 = new Goal({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                start: new Date(),
                end: new Date(),
                habitId: habit._id,
                type: 'micro_budget',
                pass: false,
                active: true
            });

            const goal3 = new Goal({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                start: new Date(),
                end: new Date(),
                habitId: new mongoose.Types.ObjectId().toHexString(),
                type: 'micro_budget',
                pass: true,
                active: false
            });

            await goal1.save(); //  active
            await goal2.save(); //  active
            await goal3.save(); //  inactive

            const query = '?active=true';

            const res = await request(server)
                .get(`/api/habits/goals/all` + query)
                .set('Accept', 'application/json')
                .set('x-auth-token', token);

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);

            expect(res.body[0]._id).toMatch(goal1._id.toString());
            expect(res.body[0].userId).toMatch(goal1.userId);

            expect(res.body[1]._id).toMatch(goal2._id.toString());
            expect(res.body[1].userId).toMatch(goal2.userId);
        });
        it('should get all goals for a user in a time period', async () => {
            const habit = new Habit({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                name: 'New Habit',
                budget: 1000,
                budgetType: 'week',
                icon: 'www.icons.com/new_habit'
            });
            await habit.save();

            const goal1 = new Goal({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                start: new Date(),
                end: new Date(),
                habitId: habit._id,
                type: 'micro_budget',
                pass: false,
                active: true
            });
            const goal2 = new Goal({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                start: new Date(),
                end: new Date(),
                habitId: habit._id,
                type: 'micro_budget',
                pass: false,
                active: true
            });


            const start = new Date();
            const end = new Date();
            start.setDate(start.getDate() - 1);
            end.setDate(end.getDate() + 1);

            const goal3 = new Goal({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: "12345",
                start: new Date(),
                end: new Date(),
                habitId: habit._id,
                type: 'micro_budget',
                pass: false,
                active: true
            });

            await goal1.save(); //  good
            await goal2.save(); //  good
            await goal3.save(); //  different user

            const query = `?start=` + start + '&end=' + end;

            const res = await request(server)
                .get(`/api/habits/goals/all` + query)
                .set('Accept', 'application/json')
                .set('x-auth-token', token);

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);

            expect(res.body[0]._id).toMatch(goal1._id.toString());
            expect(res.body[0].userId).toMatch(goal1.userId);

            expect(res.body[1]._id).toMatch(goal2._id.toString());
            expect(res.body[1].userId).toMatch(goal2.userId);
        });
    });

    //  PUT api/habits/goal/:id
    describe('PUT /goal/:id', () => {
        it('should require authorization', async () => {
            const res = await request(server).put('/api/habits/goal/1234');
            expect(res.status).toBe(401);
        });
        it('should not update a goal if it is invalid', async () => {
            const goal = new Goal({
                userId: user._id,
                start: new Date(),
                end: new Date(),
                habitId: new mongoose.Types.ObjectId().toHexString(),
                type: 'micro_budget',
                name: 'My Goal',
                period: 'custom',
                pass: false,
                active: true
            });

            const res = await request(server)
                .put("/api/habits/goal/1234")
                .send(goal)
                .set("x-auth-token", token)
                .set("Accept", "application/json");

            expect(res.body.details[0].message).toBe('"target" is required');
            expect(res.status).toBe(400);
        });

        it('reject updating if the end date is not after the start date', async () => {
            let startDate = new Date();
            const habit = new Habit({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                name: 'New Habit',
                budget: 1000,
                budgetType: 'week',
                icon: 'www.icons.com/new_habit'
            });
            await habit.save();

            let goal = new Goal({
                userId: user._id,
                start: startDate,
                end: new Date().setDate(startDate.getDate() + 1),
                habitId: habit._id,
                type: 'micro_budget',
                name: 'My Goal',
                period: 'custom',
                target: 100,
                pass: false,
                active: true
            });

            await goal.save();


            let goal2 = new Goal({
                userId: user._id,
                start: startDate,
                end: startDate,
                habitId: habit._id,
                type: 'micro_budget',
                name: 'My Goal',
                period: 'custom',
                target: 100,
                pass: false,
                active: true
            });

            const res = await request(server)
                .put("/api/habits/goal/" + goal._id)
                .send(goal2)
                .set("x-auth-token", token)
                .set("Accept", "application/json");

            expect(res.status).toBe(400);
            expect(res.text).toBe("End date must be after Start date!");
        });


        it('should update the goal target, end, period, type, and name', async () => {
            const habit = new Habit({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                name: 'New Habit',
                budget: 1000,
                budgetType: 'week',
                icon: 'www.icons.com/new_habit'
            });
            await habit.save();

            let startDate = new Date();

            let goal = new Goal({
                userId: user._id,
                start: startDate,
                end: new Date().setDate(startDate.getDate() + 1),
                habitId: habit._id,
                type: 'micro_budget',
                name: 'My Goal',
                period: 'custom',
                target: 100,
                pass: false,
                active: true
            });

            await goal.save();

            let goal2 = new Goal({
                userId: user._id,
                start: startDate,
                end: new Date().setDate(startDate.getDate() + 5),
                habitId: habit._id,
                type: 'beat',
                name: 'My Updated Goal',
                period: 'week',
                target: 99,
                pass: false,
                active: true
            });


            const res = await request(server)
                .put("/api/habits/goal/" + goal._id)
                .send(goal2)
                .set("x-auth-token", token)
                .set("Accept", "application/json");

            expect(res.status).toBe(200);
            expect(res.body.userId).toMatch(goal2.userId.toString());
            expect(res.body.habitId).toMatch(goal2.habitId.toString());
            expect(res.body.target).toBe(goal2.target);
            expect(res.body.type).toMatch(goal2.type);
            expect(res.body.name).toMatch(goal2.name);
            expect(res.body.period).toMatch(goal2.period);
            expect(new Date(res.body.end).getTime()).toBe(goal2.end.getTime());
        });
    });

    //  DELETE api/habits/goal/:id
    describe('DELETE /:id', () => {
        it('should require authorization', async () => {
            const res = await request(server).delete('/api/habits/goal/123');
            expect(res.status).toBe(401);
        });

        it('should validate the object id and return a generic error message', async () => {
            const res = await request(server)
                .delete("/api/habits/goal/1234")   //  invalid id
                .set("x-auth-token", token);

            expect(res.status).toBe(400);
            expect(res.text).toBe("Not found");
        });

        it('should make sure the goal exists', async () => {
            const res = await request(server)
                .delete("/api/habits/goal/" + new mongoose.Types.ObjectId())
                .set("x-auth-token", token)
                .set("Accept", "application/json");

            expect(res.status).toBe(404);
            expect(res.text).toBe('Goal not found');
        });

        it(`should delete the goal`, async () => {
            let startDate = new Date();
            let goal = new Goal({
                userId: user._id,
                start: startDate,
                end: new Date().setDate(startDate.getDate() + 1),
                habitId: new mongoose.Types.ObjectId(),
                type: 'micro_budget',
                name: 'My Goal',
                target: 100,
                pass: false,
                active: true
            });

            await goal.save();

            const res = await request(server)
                .delete("/api/habits/goal/" + goal._id)
                .set("x-auth-token", token)
                .set("Accept", "application/json");


            expect(res.status).toBe(200);
            expect(res.body.deletedCount).toBe(1);
        });
    });

    describe('POST /:id/goal', () => {
        it('should require authorization', async () => {
            const res = await request(server).post('/api/habits');
            expect(res.status).toBe(401);
        });
        it('should not create a goal if it is invalid', async () => {
            const goal = new Goal({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                start: new Date(),
                end: new Date(),
                habitId: new mongoose.Types.ObjectId().toHexString(),
                type: 'micro_budget',
                name: 'My Goal',
                period: 'custom',
                pass: false,
                active: true
            });
            const habitId = new mongoose.Types.ObjectId().toHexString();

            const res = await request(server)
                .post("/api/habits/" + habitId + "/goal")
                .send(goal) //  Missing target
                .set("x-auth-token", token)
                .set("Accept", "application/json");


            expect(res.body.details[0].message).toBe('"target" is required');
            expect(res.status).toBe(400);
        });

        it('should reject creation if the end date is not after the start date', async () => {
            let startDate = new Date();
            const goal = new Goal({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                start: startDate,
                end: startDate,
                habitId: new mongoose.Types.ObjectId().toHexString(),
                type: 'micro_budget',
                name: 'My Goal',
                period: 'custom',
                target: 100,
                pass: false,
                active: true
            });

            const res = await request(server)
                .post("/api/habits/" + goal.habitId + "/goal")
                .send(goal)
                .set("x-auth-token", token)
                .set("Accept", "application/json");

            expect(res.status).toBe(400);
            expect(res.text).toBe("End date must be after Start date!");
        });

        it('should reject creation if there is already an active goal for that habit', async () => {
            let startDate = new Date();
            const habit = new Habit({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                name: 'New Habit',
                budget: 1000,
                budgetType: 'week',
                icon: 'www.icons.com/new_habit'
            });
            await habit.save();

            const goal = new Goal({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                start: startDate,
                end: new Date().setDate(startDate.getDate() + 1),
                habitId: new mongoose.Types.ObjectId().toHexString(),
                type: 'micro_budget',
                name: 'My Goal',
                period: 'custom',
                target: 100.0,
                pass: false,
                active: true
            });

            await goal.save();

            const reqBody = {
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                start: startDate,
                end: new Date().setDate(startDate.getDate() + 1),
                habitId: new mongoose.Types.ObjectId().toHexString(),
                type: 'micro_budget',
                name: 'My Goal 2',
                period: 'custom',
                target: 10.0,
                pass: false,
                active: true
            };

            const res = await request(server)
                .post("/api/habits/" + habit._id + '/goal')
                .send(reqBody)
                .set("x-auth-token", token)
                .set("Accept", "application/json");


            expect(res.status).toBe(400);
            expect(res.text).toBe("There is already an active goal for this habit!");
        });


        it('should create a new goal', async () => {
            let startDate = new Date();
            const habit = new Habit({
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                name: 'New Habit',
                budget: 1000,
                budgetType: 'week',
                icon: 'www.icons.com/new_habit'
            });
            await habit.save();

            const reqBody = {
                _id: new mongoose.Types.ObjectId().toHexString(),
                userId: user._id,
                start: startDate,
                end: new Date().setDate(startDate.getDate() + 1),
                habitId: new mongoose.Types.ObjectId().toHexString(),
                type: 'micro_budget',
                name: 'My Goal',
                period: 'custom',
                target: 100.0,
                pass: false,
                active: true
            };

            const res = await request(server)
                .post("/api/habits/" + habit._id + '/goal')
                .send(reqBody)
                .set("x-auth-token", token)
                .set("Accept", "application/json");

            expect(res.status).toBe(200);
            expect(res.body.userId).toMatch(reqBody.userId.toString());
            expect(res.body.habitId).toMatch(reqBody.habitId.toString());
            expect(res.body.name).toMatch(reqBody.name);
        });
    });

});