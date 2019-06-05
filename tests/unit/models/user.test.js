const {User, validate, validatePassword} = require('../../../models/user');
const jwt = require('jsonwebtoken');
const config = require('config');
const mongoose = require('mongoose');

describe('user.generateAuthToken', () => {
    it('should require a valid JWT', () => {
        let payload = {_id: new mongoose.Types.ObjectId().toHexString()};
        const user = new User(payload);
        const token = user.generateAuthToken();
        const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
        expect(decoded).toMatchObject(payload);
    });
});

describe('user.validate', () => {
    let result;

    describe('name', () => {
        const user = {email: 'new.user@mail.com', password: '12345'};
        it('should exist', () => {
            result = validate(user);
            expect(result.error).toBeTruthy();
        });
        it('should be a string', () => {
            user.name = 12345;
            result = validate(user);
            expect(result.error).toBeTruthy();
        });
        it('should be between 3 and 50 characters', () => {
            user.name = "AB";
            result = validate(user);
            expect(result.error).toBeTruthy();

            user.name = "01234567890123456789012345678901234567890123456789FAIL";
            result = validate(user);
            expect(result.error).toBeTruthy();
        });

        it('should be accepted if valid', () => {
            user.name = "New User";
            result = validate(user);
            expect(result.error).toBeNull();
        });
    });

    describe('email', () => {
        const user = {name: 'New User', password: '12345'};
        it('should exist', () => {
            result = validate(user);
            expect(result.error).toBeTruthy();
        });
        it('should be a valid email address', () => {
            user.email = "bad.email.address";
            result = validate(user);
            expect(result.error).toBeTruthy();

            user.email = "good.email.address@test.com";
            result = validate(user);
            expect(result.error).toBeNull();
        });
        it('should be between 5 and 50 characters', () => {
            user.email = "0@12";
            result = validate(user);
            expect(result.error).toBeTruthy();

            user.email = "0@123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890";
            result = validate(user);
            expect(result.error).toBeTruthy();
        });
        it('should be accepted if valid', () => {
            user.email = "good.email.address@test.com";
            result = validate(user);
            expect(result.error).toBeNull();
        });
    });

    describe('password', () => {
        const user = {email: 'new.user@mail.com', name: 'New User'};
        it('should exist', () => {
            result = validate(user);
            expect(result.error).toBeTruthy();
        });
        it('should be a string', () => {
            user.password = 12345;
            result = validate(user);
            expect(result.error).toBeTruthy();
        });
        it('should be between 5 and 25 characters', () => {
            user.password = "123";
            result = validate(user);
            expect(result.error).toBeTruthy();

            user.password = "012345678901234567890123456";
            result = validate(user);
            expect(result.error).toBeTruthy();
        });
        it('should satisfy the complexity requirements by having at least 1 lowercase letter and 1 numeric', () => {
            result = validatePassword("abCD12#$");
            expect(result.error).toBeNull();

            result = validatePassword("abc123");
            expect(result.error).toBeNull();

            result = validatePassword("ABCDEFG");
            expect(result.error).toBeTruthy();

            result = validatePassword("abcDEFG");
            expect(result.error).toBeTruthy();

            result = validatePassword("123456");
            expect(result.error).toBeTruthy();

            result = validatePassword("!@#$%^&");
            expect(result.error).toBeTruthy();

        });
        it('should be accepted if valid', () => {
            user.password = "12345";
            result = validate(user);
            expect(result.error).toBeNull();
        });
    });
});