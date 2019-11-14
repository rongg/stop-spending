const {validation} = require('../../../models/goal');

describe('goal.validation.check', () => {
    const validGoal = {
        userId: "12345",
        start: new Date(),
        end: new Date(),
        habitId: "12345",
        type: 'micro_budget',
        period: 'custom',
        pass: false,
        active: true

    };
    let result;
    describe('userId', () => {
        it('should exist', () => {
            const goal = Object.assign({}, validGoal);
            delete goal.userId;
            result = validation.check(goal);
            expect(result.error).toBeTruthy();
        });
        it('should be a string', () => {
            const goal = Object.assign({}, validGoal);
            goal.userId = 12345;
            result = validation.check(goal);
            expect(result.error).toBeTruthy();
        });
        it('should be less than 25 characters', () => {
            const goal = Object.assign({}, validGoal);
            goal.userId = "12345678901234567890123456789";
            result = validation.check(goal);
            expect(result.error).toBeTruthy();
        });
    });
    describe('start', () => {
        it('should exist', () => {
            const goal = Object.assign({}, validGoal);
            delete goal.start;
            result = validation.check(goal);
            expect(result.error).toBeTruthy();
        });
        it('should be a valid date string or millisecond value', () => {
            const goal = Object.assign({}, validGoal);
            goal.start = "abc";
            result = validation.check(goal);
            expect(result.error).toBeTruthy();
        });
    });
    describe('end', () => {
        it('should exist', () => {
            const goal = Object.assign({}, validGoal);
            delete goal.end;
            result = validation.check(goal);
            expect(result.error).toBeTruthy();
        });
        it('should be a valid date string or millisecond value', () => {
            const goal = Object.assign({}, validGoal);
            goal.end = "abc";
            result = validation.check(goal);
            expect(result.error).toBeTruthy();
        });
    });
    describe('habitId', () => {
        it('should exist', () => {
            const goal = Object.assign({}, validGoal);
            delete goal.habitId;
            result = validation.check(goal);
            expect(result.error).toBeTruthy();
        });
        it('should be a string', () => {
            const goal = Object.assign({}, validGoal);
            goal.habitId = 12345.5;
            result = validation.check(goal);
            expect(result.error).toBeTruthy();
        });
        it('should be less than 25 characters', () => {
            const goal = Object.assign({}, validGoal);
            goal.habitId = "12345678901234567890123456789";
            result = validation.check(goal);
            expect(result.error).toBeTruthy();
        });
    });
    describe('type', () => {
        it('should exist', () => {
            const goal = Object.assign({}, validGoal);
            delete goal.type;
            result = validation.check(goal);
            expect(result.error).toBeTruthy();
        });
        it('should be a string', () => {
            const goal = Object.assign({}, validGoal);
            goal.type = 12345.5;
            result = validation.check(goal);
            expect(result.error).toBeTruthy();
        });
        it('should be less than 25 characters', () => {
            const goal = Object.assign({}, validGoal);
            goal.type = "12345678901234567890123456789";
            result = validation.check(goal);
            expect(result.error).toBeTruthy();
        });
    });
    describe('target', () => {
        it('should exist', () => {
            const goal = Object.assign({}, validGoal);
            delete goal.target;
            result = validation.check(goal);
            expect(result.error).toBeTruthy();
        });
        it('should be a number', () => {
            const goal = Object.assign({}, validGoal);

            goal.target = 10.5;
            result = validation.check(goal);
            expect(result.error).toBeNull();

            goal.target = 10;
            result = validation.check(goal);
            expect(result.error).toBeNull();

            goal.target = "abcdef";
            result = validation.check(goal);
            expect(result.error).toBeTruthy();
        });
    });
    describe('pass', () => {
        it('should be a boolean', () => {
            const goal = Object.assign({}, validGoal);
            goal.pass = "bad";
            result = validation.check(goal);
            expect(result.error).toBeTruthy();
        });
    });
    describe('active', () => {
        it('should be a boolean', () => {
            const goal = Object.assign({}, validGoal);
            goal.active = "bad";
            result = validation.check(goal);
            expect(result.error).toBeTruthy();
        });
    });
});
