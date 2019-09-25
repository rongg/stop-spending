const {validation} = require('../../../models/urge');

describe('urge.validation.check', () => {
    const validUrge = {
        userId: "12345",
        date: new Date(),
        habitId: "12345"
    };
    let result;
    describe('userId', () => {
        it('should exist', () => {
            const urge = Object.assign({}, validUrge);
            delete urge.userId;
            result = validation.check(urge);
            expect(result.error).toBeTruthy();
        });
        it('should be a string', () => {
            const urge = Object.assign({}, validUrge);
            urge.userId = 12345;
            result = validation.check(urge);
            expect(result.error).toBeTruthy();
        });
        it('should be less than 25 characters', () => {
            const urge = Object.assign({}, validUrge);
            urge.userId = "12345678901234567890123456789";
            result = validation.check(urge);
            expect(result.error).toBeTruthy();
        });
    });
    describe('date', () => {
        it('should be a valid date string or millisecond value', () => {
            const urge = Object.assign({}, validUrge);
            urge.date = "abc";
            result = validation.check(urge);
            expect(result.error).toBeTruthy();
        });
    });
    describe('habitId', () => {
        it('should be a string', () => {
            const urge = Object.assign({}, validUrge);
            urge.habitId = 12345.5;
            result = validation.check(urge);
            expect(result.error).toBeTruthy();
        });
        it('should be less than 25 characters', () => {
            const urge = Object.assign({}, validUrge);
            urge.habitId = "12345678901234567890123456789";
            result = validation.check(urge);
            expect(result.error).toBeTruthy();
        });
    });
});
