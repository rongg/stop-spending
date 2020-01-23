const request = require('supertest');
const {User, generateVerificationToken} = require('../../models/user');
const {Habit} = require('../../models/habit');
const {Expense} = require('../../models/expense');
const {Urge} = require('../../models/urge');
const {Goal} = require('../../models/goal');
const {VerifyToken} = require('../../models/verify_token');
const mongoose = require('mongoose');


describe('api/users', () => {
    beforeEach(() => {
        server = require('../../index');
    });
    afterEach(async () => {
        await User.deleteMany({});
        await VerifyToken.deleteMany({});
        server.close();
    });

    describe('GET /me', () => {
        it('should return unauthorized if the user is not logged in', async () => {
            const res = await request(server).get('/api/users/me');
            expect(res.status).toBe(401);
        });

        it('should get the currently logged in user', async () => {
            const user = new User({
                _id: new mongoose.Types.ObjectId().toHexString(),
                name: "New User",
                email: "new.user@mail.com",
                password: "12345"
            });
            await user.save();
            const token = user.generateAuthToken();

            const res = await request(server)
                .get('/api/users/me')
                .set('Accept', 'application/json')
                .set('x-auth-token', token);

            expect(res.body._id.toString()).toBe(user._id.toString());
            expect(res.body.name).toBe(user.name);
            expect(res.body.email).toBe(user.email);
            expect(res.body.password).toBeUndefined();
        });
    });

    describe('POST /', () => {
        it('should reject creating a user if it is invalid', async () => {
            const user = new User({ //  Missing name
                email: "new.user@mail.com",
                password: "abc123"
            });
            const res = await request(server)
                .post('/api/users')
                .send(user)
                .set('Accept', 'application/json');

            expect(res.status).toBe(400);
            expect(res.body.details[0].message).toBe("\"name\" is required");
        });
        it(`should reject creating a user if the password doesn't meet complexity requirements`, async () => {
            const user = new User({
                name: "new user",
                email: "new.user@mail.com",
                password: "missing_numeric"
            });
            const res = await request(server)
                .post('/api/users')
                .send(user)
                .set('Accept', 'application/json');

            expect(res.status).toBe(400);
            expect(res.body.details[0].message).toBe("\"value\" doesn't contain the required numeric characters");
        });

        it('should reject creating a user if it already exists', async () => {
            let user = new User({
                name: 'Dup User 1',
                email: "new.user@mail.com",
                password: "abc123"
            });
            await request(server)
                .post('/api/users')
                .send(user)
                .set('Accept', 'application/json');

            user.name = "Dup User 2";
            const res = await request(server)
                .post('/api/users')
                .send(user)
                .set('Accept', 'application/json');

            expect(res.status).toBe(400);
        });

        it('should create a new user', async () => {
            const user = new User({
                name: 'Valid User',
                email: "valid.user@mail.com",
                password: "abc123"
            });
            const res = await request(server)
                .post('/api/users')
                .send(user)
                .set('Accept', 'application/json');

            expect(res.status).toBe(200);
            expect(res.headers['x-auth-token']).toBeTruthy();
            expect(res.body.name).toMatch(user.name);
            expect(res.body.email).toMatch(user.email);
            expect(res.body.password).toBeUndefined();
        });

        it('should create a verification token when creating a new user', async () => {
            const user = new User({
                name: 'Valid User',
                email: "valid.user@mail.com",
                password: "abc123"
            });
            const res = await request(server)
                .post('/api/users')
                .send(user)
                .set('Accept', 'application/json');

            expect(res.status).toBe(200);

            const token = await VerifyToken.findOne({_userId: res.body._id});

            expect(token._userId.toString()).toBe(res.body._id);
        });
    });

    describe('POST /reset/password', () => {
        it('should reject an invalid email', async () => {
            const res = await request(server)
                .post('/api/users/reset/password')
                .send({email: 'blah'})
                .set('Accept', 'application/json');

            expect(res.status).toBe(400);
            expect(res.body.name).toBe('ValidationError');
        });
        it('should return 400 if the user does not exist', async () => {

            const res = await request(server)
                .post('/api/users/reset/password')
                .send({email: 'blah@mail.com'})
                .set('Accept', 'application/json');

            expect(res.status).toBe(400);
            expect(res.text).toBe('No account for email provided.')
        });
        it('should create a verification token for the user', async () => {
            const user = new User({
                name: 'Valid User',
                email: "valid.user@mail.com",
                password: "abc123"
            });
            await user.save();
            const res = await request(server)
                .post('/api/users/reset/password')
                .send({email: user.email})
                .set('Accept', 'application/json');

            expect(res.status).toBe(200);

            const token = await VerifyToken.findOne({_userId: user._id.toString()});

            expect(token._userId.toString()).toBe(user._id.toString());
        });
    });

    describe('POST /reset/password/:token', () => {
        it('should reject an invalid or expired token', async () => {
            const res = await request(server)
                .post('/api/users/reset/password/' + generateVerificationToken())
                .send({password: 'abc123'})
                .set('Accept', 'application/json');
            expect(res.status).toBe(400);
            expect(res.body.msg).toBe('We were unable to find a valid token. Your token may have expired.');
        });
        it('should reject an invalid password', async () => {
            const user = new User({
                name: 'Valid User',
                email: "valid.user@mail.com",
                password: "abc123"
            });
            await user.save();

            const verifyToken = new VerifyToken({_userId: user._id, token: generateVerificationToken()});
            await verifyToken.save();

            const res = await request(server)
                .post('/api/users/reset/password/' + verifyToken.token)
                .send({userId: user._id, password: 'abcdefg'})
                .set('Accept', 'application/json');

            expect(res.status).toBe(400);
            expect(res.body.name).toBe('ValidationError');
        });
        it('should return 400 if the user does not exist', async () => {
            const user = new User({
                name: 'Valid User',
                email: "valid.user@mail.com",
                password: "abc123"
            });
            await user.save();

            const verifyToken = new VerifyToken({_userId: user._id, token: generateVerificationToken()});
            await verifyToken.save();

            await user.delete();

            const res = await request(server)
                .post('/api/users/reset/password/' + verifyToken.token)
                .send({userId: user._id, password: 'abc123'})
                .set('Accept', 'application/json');

            expect(res.status).toBe(400);
            expect(res.text).toBe('User does not exist.');
        });
        it('should reset the password and delete the verification token', async () => {
            const user = new User({
                name: 'Valid User',
                email: "valid.user@mail.com",
                password: "abc123"
            });
            await user.save();

            let verifyToken = new VerifyToken({_userId: user._id, token: generateVerificationToken()});
            await verifyToken.save();

            const res = await request(server)
                .post('/api/users/reset/password/' + verifyToken.token)
                .send({userId: user._id, password: 'new123'})
                .set('Accept', 'application/json');

            verifyToken = await VerifyToken.findById(verifyToken._id);

            expect(res.status).toBe(200);
            expect(res.text).toBe('Your password has been reset! Please log in.');
            expect(verifyToken).toBeNull();
        });
    });

    describe('POST /verify/:id', () => {
        it('should verify the user with the supplied token and delete the verification token', async () => {
            const user = new User({
                name: 'Valid User',
                email: "valid.user@mail.com",
                password: "abc123"
            });

            await user.save();
            let verifyToken = new VerifyToken({_userId: user._id, token: generateVerificationToken()});
            await verifyToken.save();

            const res = await request(server)
                .post('/api/users/verify/' + verifyToken.token)
                .send();


            verifyToken = await VerifyToken.findById(verifyToken._id);

            expect(res.status).toBe(200);
            expect(res.body._id).toBe(user._id.toString());
            expect(res.body.isVerified).toBe(true);
            expect(verifyToken).toBeNull();
        });

        it('should reject verification if the token does not exists', async () => {
            const user = new User({
                name: 'Valid User',
                email: "valid.user@mail.com",
                password: "abc123"
            });

            await user.save();
            const verifyToken = new VerifyToken({_userId: user._id, token: generateVerificationToken()});
            await verifyToken.save();
            //  Simulate expiration by deleting token
            await verifyToken.delete();

            const res = await request(server)
                .post('/api/users/verify/' + verifyToken.token)
                .send();

            expect(res.status).toBe(400);
            expect(res.body.result).toBe('not-verified');
            expect(res.body.msg).toBe('We were unable to find a valid token. Your token may have expired.');
        });

        it('should reject verification if the user is already verified or if the user does not exist', async () => {
            const user = new User({
                name: 'Valid User',
                email: "valid.user@mail.com",
                password: "abc123",
                isVerified: true
            });

            await user.save();
            const verifyToken = new VerifyToken({_userId: user._id, token: generateVerificationToken()});
            await verifyToken.save();

            let res = await request(server)
                .post('/api/users/verify/' + verifyToken.token)
                .send();

            expect(res.status).toBe(400);
            expect(res.body.result).toBe('already-verified');
            expect(res.body.msg).toBe('This user has already been verified.');

            await user.delete();

            res = await request(server)
                .post('/api/users/verify/' + verifyToken.token)
                .send();

            expect(res.status).toBe(400);
            expect(res.body.msg).toBe('We were unable to find a user for this token.');
        });
    });

    describe('POST /resend/verification', () => {
        it('should reject an unauthenticated request', async () => {
            const res = await request(server).post('/api/users/resend/verification');
            expect(res.status).toBe(401);
        });
        it('should create a new verification token', async () => {
            const user = new User({
                name: 'Valid User',
                email: "valid.user@mail.com",
                password: "abc123"
            });

            await user.save();

            const authToken = user.generateAuthToken();

            const res = await request(server)
                .post('/api/users/resend/verification')
                .set('Accept', 'application/json')
                .set('x-auth-token', authToken);

            expect(res.status).toBe(200);

            const verifyToken = await VerifyToken.findOne({_userId: user._id});

            expect(verifyToken._userId.toString()).toBe(user._id.toString());
        });
    });

    //  TO DO : Updating a User -- name, password, and email
    describe('PUT /', () => {
        let token, user;
        beforeEach(async () => {
            user = new User({
                name: "New User",
                email: "new.user@mail.com",
                password: "12345"
            });
            user = await user.save();
            token = user.generateAuthToken();
        });
        afterEach(async () => {
            User.deleteMany({});
        });
        it('should require authorization', async () => {
            const res = await request(server).put('/api/users/123');
            expect(res.status).toBe(401);
        });
        it('should validate the object id and return a generic error message', async () => {
            const res = await request(server)
                .put("/api/users/1234")   //  invalid id
                .set("x-auth-token", token);

            expect(res.status).toBe(400);
            expect(res.text).toBe("Not found");
        });
        it('should reject invalid input', async () => {
            user.name = "";
            const res = await request(server)
                .put("/api/users/" + user._id)
                .send(user)
                .set("x-auth-token", token);
            expect(res.status).toBe(400);
        });
        it('should check that the user exists', async () => {
            const res = await request(server)
                .put("/api/users/" + new mongoose.Types.ObjectId())
                .send({
                    name: 'Updated',
                    email: 'updated@mail.com',
                    password: '56789'
                })
                .set("x-auth-token", token);

            expect(res.status).toBe(404);
            expect(res.text).toBe("User not found");
        });
        it('should update the name but not the email and password', async () => {
            let body = {
                name: 'Updated',
                email: 'update@mail.com',
                password: "99999"
            };
            const res = await request(server)
                .put("/api/users/" + user._id)
                .send(body)
                .set("x-auth-token", token);

            expect(res.status).toBe(200);
            expect(res.body.name).toBe(body.name);
            expect(res.body.email === body.email).toBe(false);
            expect(res.body.password === body.password).toBe(false);
        });
    });

    //  TO DO : Deleting a User
    describe('DELETE /', () => {
        let token, user;
        beforeEach(async () => {
            user = new User({
                name: "New User",
                email: "new.user@mail.com",
                password: "12345"
            });
            user = await user.save();
            token = user.generateAuthToken();
        });
        afterEach(async () => {
            User.deleteMany({});
        });
        it('should require authorization', async () => {
            const res = await request(server).delete('/api/users/123');
            expect(res.status).toBe(401);
        });
        it('should check that the user exists', async () => {
            const res = await request(server)
                .delete("/api/users/" + new mongoose.Types.ObjectId())
                .set("x-auth-token", token);

            expect(res.status).toBe(404);
            expect(res.text).toBe("User not found");
        });
        it('should delete the user + expenses + habits + urges + goals', async () => {
            const habit = new Habit({name: 'test', userId: user._id, budget: 100, budgetType: 'month'});
            const expense = new Expense({name: 'test', userId: user._id, amount: 99, needWant: 'need'});
            const urge = new Urge({userId: user._id, habitId: habit._id});
            const goal = new Goal({
                userId: user._id,
                start: new Date(),
                end: new Date(new Date().getTime() + 5*60000),
                habitId: habit._id,
                type: 'micro_budget',
                pass: false,
                active: true
            });
            await habit.save();
            await expense.save();
            await urge.save();
            await goal.save();

            const res = await request(server)
                .delete('/api/users/' + user._id)
                .set('x-auth-token', token);
            expect(res.status).toBe(200);
            expect(res.body[0].deletedCount).toBe(1);
            expect(res.body[1].deletedCount).toBe(1);
            expect(res.body[2].deletedCount).toBe(1);
            expect(res.body[3].deletedCount).toBe(1);
            expect(res.body[4].deletedCount).toBe(1);
        });
    });

});