const request = require('supertest');
const {Expense} = require('../../models/expense');
const {User} = require('../../models/user');
const {Habit} = require('../../models/habit');
const mongoose = require('mongoose');

let server;

describe('api/expenses', () => {
    let user, token, habit;

    beforeEach(async () => {
        server = require('../../index');
        user = new User({
            _id: new mongoose.Types.ObjectId(),
            name: 'Test User',
            email: 'test.user@mail.com',
            password: '12345'
        });

        habit = new Habit({
            name: 'Test Habit',
            budget: 1500
        });

        token = user.generateAuthToken();
        await user.save();
        await habit.save();
    });

    afterEach(async () => {
        await User.deleteMany({});
        await Expense.deleteMany({});
        await Habit.deleteMany({});
        server.close();
    });

    describe('GET /', () => {
        it('should require authorization', async () => {
            const res = await request(server).get('/api/expenses');
            expect(res.status).toBe(401);
        });
        it('should return all expenses for a user', async () => {
            const expense1 = new Expense({
                userId: user._id,
                name: 'Expense 1',
                amount: 50,
                habitId: habit._id,
                habitName: habit.name
            });
            await expense1.save();

            const expense2 = new Expense({
                userId: user._id,
                name: 'Expense 2',
                amount: 75,
                habitId: habit._id,
                habitName: habit.name
            });
            await expense2.save();

            const res = await request(server)
                .get('/api/expenses')
                .set('Accept', 'application/json')
                .set('x-auth-token', token);

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);

            expect(res.body[0]._id).toMatch(expense1._id.toString());
            expect(res.body[0].name).toMatch(expense1.name);
            expect(res.body[0].amount).toBe(expense1.amount);
            expect(res.body[0].userId).toMatch(expense1.userId);

            expect(res.body[1]._id).toMatch(expense2._id.toString());
            expect(res.body[1].name).toMatch(expense2.name);
            expect(res.body[1].amount).toBe(expense2.amount);
            expect(res.body[1].userId).toMatch(expense2.userId);

        });
    });

    describe('GET /:id', () => {
        it('should require authorization', async () => {
            const res = await request(server).get('/api/expenses');
            expect(res.status).toBe(401);
        });
        it('should get a single expense', async () => {
            const expense = new Expense({
                userId: user._id,
                name: 'Expense 1',
                amount: 50,
                habitId: habit._id,
                habitName: habit.name
            });
            await expense.save();

            const res = await request(server)
                .get(`/api/expenses/${expense._id}`)
                .set('Accept', 'application/json')
                .set('x-auth-token', token);

            expect(res.status).toBe(200);
            expect(res.body._id).toMatch(expense._id.toString());
            expect(res.body.name).toMatch(expense.name);
            expect(res.body.amount).toBe(expense.amount);
            expect(res.body.userId).toMatch(expense.userId);
        });
    });

    describe('POST /', () => {
        it('should require authorization', async () => {
            const res = await request(server).post('/api/expenses');
            expect(res.status).toBe(401);
        });

        it('should not create a expense if it is invalid', async () => {
            const expense = new Expense({
                userId: user._id,
                name: 'Expense 1',
                amount: "should be integer",
                habitId: habit._id,
                habitName: habit.name
            });
            const res = await request(server)
                .post("/api/expenses")
                .send(expense)
                .set("x-auth-token", token)
                .set("Accept", "application/json");

            expect(res.status).toBe(400);
        });

        it('should check that the user exists', async () => {
            const expense = new Expense({
                userId: new mongoose.Types.ObjectId(),
                name: 'Expense 1',
                amount: 75,
                habitId: habit._id,
                habitName: habit.name
            });
            const res = await request(server)
                .post("/api/expenses")
                .send(expense)
                .set("x-auth-token", token)
                .set("Accept", "application/json");

            expect(res.status).toBe(400);
            expect(res.text).toBe("User doesn't exist");
        });

        it('should create a new expense', async () => {
            const expense = new Expense({
                userId: user._id,
                name: 'Expense 1',
                amount: 27,
                habitId: habit._id.toString(),
                habitName: habit.name
            });
            const res = await request(server)
                .post("/api/expenses")
                .send(expense)
                .set("x-auth-token", token)
                .set("Accept", "application/json");

            expect(res.status).toBe(200);
            expect(res.body.name).toMatch(expense.name);
            expect(res.body.amount).toBe(expense.amount);
            expect(res.body.habitName).toMatch(expense.habitName);
        });
    });

    describe('PUT /:id', () => {
        it('should require authorization', async () => {
            const res = await request(server).put('/api/expenses/123');
            expect(res.status).toBe(401);
        });
        it('should validate the object id and return generic error message', async () => {
            const res = await request(server)
                .put("/api/expenses/1234")
                .set("x-auth-token", token);

            expect(res.status).toBe(400);
            expect(res.text).toBe("Not found");
        });
        it('should reject an invalid expense', async () => {
            const expense = new Expense({
                userId: user._id,
                name: 'Expense 1',
                amount: 100,
                habitId: habit._id.toString(),
                habitName: habit.name
            });
            const res1 = await request(server)
                .post("/api/expenses")
                .send(expense)
                .set("x-auth-token", token)
                .set("Accept", "application/json");

            expense.amount = 0;

            const res2 = await request(server)
                .put("/api/expenses/" + res1.body._id)
                .send(expense)
                .set("x-auth-token", token)
                .set("Accept", "application/json");

            expect(res2.status).toBe(400);
        });
        it('should make sure the expense exists', async () => {
            const expense = new Expense({
                userId: user._id,
                name: 'Expense 1',
                amount: 100,
                habitId: habit._id.toString(),
                habitName: habit.name
            });
            const res = await request(server)
                .put("/api/expenses/" + new mongoose.Types.ObjectId())
                .send(expense)
                .set("x-auth-token", token)
                .set("Accept", "application/json");

            expect(res.status).toBe(404);
            expect(res.text).toBe('Expense not found')
        });
        it('should update the expense', async () => {
            const expense = new Expense({
                userId: user._id,
                name: 'Expense 1',
                amount: 100,
                habitId: habit._id.toString(),
                habitName: habit.name
            });
            const res1 = await request(server)
                .post("/api/expenses")
                .send(expense)
                .set("x-auth-token", token)
                .set("Accept", "application/json");
            const habit2 = new Habit({
                name: 'Test Habit 2',
                budget: 600
            });
            await habit2.save();

            expense.name = "Updated Expense";
            expense.amount = 1999;
            expense.habitName = habit2.name;
            expense.habitId = habit2._id;

            const res2 = await request(server)
                .put("/api/expenses/" + res1.body._id)
                .send(expense)
                .set("x-auth-token", token)
                .set("Accept", "application/json");

            expect(res2.status).toBe(200);
            expect(res2.body.name).toBe(expense.name);
            expect(res2.body.amount).toBe(expense.amount);
            expect(res2.body.habitName).toBe(expense.habitName);
            expect(res2.body.habitId).toBe(expense.habitId.toString());
        });
    });

    describe('DELETE /:id', () => {
        it('should require authorization', async () => {
            const res = await request(server).delete('/api/expenses/123');
            expect(res.status).toBe(401);
        });

        it('should validate the object id and return a generic error message', async () => {
            const res = await request(server)
                .delete("/api/expenses/1234")   //  invalid id
                .set("x-auth-token", token);

            expect(res.status).toBe(400);
            expect(res.text).toBe("Not found");
        });

        it('should make sure the expense exists', async () => {
            const expense = new Expense({
                userId: user._id,
                name: 'Expense 1',
                amount: 100,
                habitId: habit._id.toString(),
                habitName: habit.name
            });
            const res = await request(server)
                .delete("/api/expenses/" + new mongoose.Types.ObjectId())
                .send(expense)
                .set("x-auth-token", token)
                .set("Accept", "application/json");

            expect(res.status).toBe(404);
            expect(res.text).toBe('Expense not found')
        });

        it('should delete the expense', async () => {
            const expense = new Expense({
                userId: user._id,
                name: 'Expense 1',
                amount: 100,
                habitId: habit._id,
                habitName: habit.name
            });
            const res1 = await request(server)
                .post("/api/expenses")
                .send(expense)
                .set("x-auth-token", token)
                .set("Accept", "application/json");

            const res2 = await request(server)
                .delete("/api/expenses/" + res1.body._id)
                .set("x-auth-token", token)
                .set("Accept", "application/json");

            expect(res2.status).toBe(200);
            expect(res2.body.deletedCount).toBe(1);
        });
    });
});