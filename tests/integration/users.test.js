const request = require('supertest');
const {User} = require('../../models/user');
const mongoose = require('mongoose');


describe('api/users', () => {
    beforeEach(() => {
        server = require('../../index');
    });
    afterEach(async () => {
        await User.deleteMany({});
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
        it('should update the name and email but not the password', async () => {
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
            expect(res.body.email).toBe(body.email);
            expect(res.body.password === body.password).toBe(false);
        });
    });

    //  TO DO : Deleting a User
    describe('DELETE /', () => {let token, user;
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
        it('should delete the user', async () => {
            const res = await request(server)
                .delete('/api/users/' + user._id)
                .set('x-auth-token', token);

            expect(res.status).toBe(200);
            expect(res.body.deletedCount).toBe(1);
        });
    });

});