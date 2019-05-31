const request = require('supertest');
const {User} = require('../../models/user');
const mongoose = require('mongoose');


describe('/api/auth', () => {
    beforeEach(async () => {
        server = require('../../index');
        user = new User({
            _id: new mongoose.Types.ObjectId().toHexString(),
            name: 'Test User',
            email: 'test.user@mail.com',
            password: '12345'
        });
        await request(server)
            .post("/api/users")
            .send(user)
            .set("Accept", "application/json");
    });
    afterEach(async () => {
        server.close();
        await User.deleteMany({});
    });

    describe('POST /', () => {
        it('should reject an invalid request body', async () => {
            let body = {
                email: "bad email",
                password: user.password
            };
            let res = await request(server)
                .post("/api/auth")
                .send(body)
                .set("Accept", "application/json");

            expect(res.status).toBe(400);

            body.email = user.email;
            body.password = "short";

            res = await request(server)
                .post("/api/auth")
                .send(body)
                .set("Accept", "application/json");

            expect(res.status).toBe(400);
        });
        it('should check that a user exists for the given email', async () => {
            const body = {
                email: "doesnt.exist@mail.com",
                password: user.password
            };
            const res = await request(server)
                .post("/api/auth")
                .send(body)
                .set("Accept", "application/json");

            expect(res.status).toBe(400);
            expect(res.text).toBe("Invalid username or password");
        });
        it('should check that the password is correct', async () => {
            const body = {
                email: user.email,
                password: "wrong_password"
            };
            const res = await request(server)
                .post("/api/auth")
                .send(body)
                .set("Accept", "application/json");

            expect(res.status).toBe(400);
            expect(res.text).toBe("Invalid username or password");
        });

        it('should return a token to the authenticated user', async () => {
            const body = {
                email: user.email,
                password: user.password
            };
            const res = await request(server)
                .post("/api/auth")
                .send(body)
                .set("Accept", "application/json");

            expect(res.status).toBe(200);
            expect(res.text).toBeTruthy();
        });
    });
});