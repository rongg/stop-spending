const request = require('supertest');
const {Habit} = require('../../models/habit');
const {User} = require('../../models/user');
const {Expense} = require('../../models/expense');
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

            habit.budget = 0;

            const res2 = await request(server)
                .put("/api/habits/" + res1.body._id)
                .send(habit)
                .set("x-auth-token", token)
                .set("Accept", "application/json");

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

});