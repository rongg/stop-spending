const {validation} = require('../../../models/habit');

describe('habit.validation.check', () => {
    let result;
    const validHabit = {userId: "12345", name: 'New Habit', budget: 100, budgetType: 'Week'};
    describe('userId', () => {
        it('should exist', () => {
            const habit = Object.assign({}, validHabit);
            delete habit.userId;
            result = validation.check(habit);
            expect(result.error).toBeTruthy();
        });
        it('should be a string', () => {
            const habit = Object.assign({}, validHabit);
            habit.userId = 12345;
            result = validation.check(habit);
            expect(result.error).toBeTruthy();
        });
        it('should be less than 25 characters', () => {
            const habit = Object.assign({}, validHabit);
            habit.userId = "0@1234567890123456789012345678901234567890";
            result = validation.check(habit);
            expect(result.error).toBeTruthy();
        });
    });
    describe('name', () => {
        it('should exist', () => {
            const habit = Object.assign({}, validHabit);
            delete habit.name;
            result = validation.check(habit);
            expect(result.error).toBeTruthy();
        });
        it('should be a string', () => {
            const habit = Object.assign({}, validHabit);
            habit.name = 12345;
            result = validation.check(habit);
            expect(result.error).toBeTruthy();
        });
        it('should be between 3 and 50 characters', () => {
            const habit = Object.assign({}, validHabit);
            habit.name = "ab";
            result = validation.check(habit);
            expect(result.error).toBeTruthy();

            habit.name = "01234567890123456789012345678901234567890123456789FAIL";
            result = validation.check(habit);
            expect(result.error).toBeTruthy();
        });
    });
    describe('budget', () => {
        it('should exist', () => {
            const habit = Object.assign({}, validHabit);
            delete habit.budget;
            result = validation.check(habit);
            expect(result.error).toBeTruthy();
        });
        it('should be a number', () => {
            const habit = Object.assign({}, validHabit);
            habit.budget = 12345.5;
            result = validation.check(habit);
            expect(result.error).toBeNull();

            habit.budget = "bacd";
            result = validation.check(habit);
            expect(result.error).toBeTruthy();
        });
        it('should be between 1 and 1000000000', () => {
            const habit = Object.assign({}, validHabit);
            habit.budget = 0;
            result = validation.check(habit);
            expect(result.error).toBeTruthy();

            habit.budget = 1000000001;
            result = validation.check(habit);
            expect(result.error).toBeTruthy();
        });
    });
    describe('budgetType', () => {
        it('should exist', () => {
            const habit = Object.assign({}, validHabit);
            delete habit.budgetType;
            result = validation.check(habit);
            expect(result.error).toBeTruthy();
        });
        it('should be a string', () => {
            const habit = Object.assign({}, validHabit);
            habit.budgetType = 12345;
            result = validation.check(habit);
            expect(result.error).toBeTruthy();

        });
        it('should be between 1 and 25 characters', () => {
            const habit = Object.assign({}, validHabit);
            habit.budgetType = "abc";
            result = validation.check(habit);
            expect(result.error).toBeFalsy();

            habit.budgetType = "01234567890123456789012345678901234567890123456789FAIL";
            result = validation.check(habit);
            expect(result.error).toBeTruthy();
        });
    });
    describe('icon', () => {
        it('should be a string', () => {
            const habit = Object.assign({}, validHabit);
            habit.icon = 12345;
            result = validation.check(habit);
            expect(result.error).toBeTruthy();
        });

        it('should be less than 255 characters', () => {
            const habit = Object.assign({}, validHabit);
            habit.icon = "0@12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012" +
                "3456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345" +
                "67890123456789012345678901234567890123456789012345678901234567890";
            result = validation.check(habit);
            expect(result.error).toBeTruthy();
        });
    });
});
