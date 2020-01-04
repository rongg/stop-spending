const {validation} = require('../../../models/expense');

describe('expense.validation.check', () => {
    const validExpense = {
        userId: "12345",
        name: "New Expense",
        amount: 100,
        date: new Date(),
        habitId: "12345",
        needWant: "Want"
    };
    let result;
    describe('userId', () => {
        it('should exist', () => {
            const expense = Object.assign({}, validExpense);
            delete expense.userId;
            result = validation.check(expense);
            expect(result.error).toBeTruthy();
        });
        it('should be a string', () => {
            const expense = Object.assign({}, validExpense);
            expense.userId = 12345;
            result = validation.check(expense);
            expect(result.error).toBeTruthy();
        });
        it('should be less than 25 characters', () => {
            const expense = Object.assign({}, validExpense);
            expense.userId = "12345678901234567890123456789";
            result = validation.check(expense);
            expect(result.error).toBeTruthy();
        });
    });
    describe('name', () => {
        it('should exist', () => {
            const expense = Object.assign({}, validExpense);
            delete expense.name;
            result = validation.check(expense);
            expect(result.error).toBeTruthy();
        });
        it('should be a string', () => {
            const expense = Object.assign({}, validExpense);
            expense.name = 12345;
            result = validation.check(expense);
            expect(result.error).toBeTruthy();
        });
        it('should be between 3 and 50 characters', () => {
            const expense = Object.assign({}, validExpense);
            expense.name = "ab";
            result = validation.check(expense);
            expect(result.error).toBeTruthy();
            expense.name = "abcdefghijabcdefghijabcdefghijabcdefghijabcdefghijFAIL";
            result = validation.check(expense);
            expect(result.error).toBeTruthy();
        });
    });
    describe('amount', () => {
        it('should exist', () => {
            const expense = Object.assign({}, validExpense);
            delete expense.amount;
            result = validation.check(expense);
            expect(result.error).toBeTruthy();

        });
        it('should be a number', () => {
            const expense = Object.assign({}, validExpense);
            expense.amount = .01;
            result = validation.check(expense);
            expect(result.error).toBe(null);
            expense.amount = "abcdefg";
            result = validation.check(expense);
            expect(result.error).toBeTruthy();
        });
        it('should be between .01 and 1000000000', () => {
            const expense = Object.assign({}, validExpense);
            expense.amount = 0;
            result = validation.check(expense);
            expect(result.error).toBeTruthy();
            expense.amount = 1000000001;
            result = validation.check(expense);
            expect(result.error).toBeTruthy();
        });
    });
    describe('date', () => {
        it('should be a valid date string or millisecond value', () => {
            const expense = Object.assign({}, validExpense);
            expense.date = "abc";
            result = validation.check(expense);
            expect(result.error).toBeTruthy();
        });
    });
    describe('habitId', () => {
        it('should be a string', () => {
            const expense = Object.assign({}, validExpense);
            expense.habitId = 12345.5;
            result = validation.check(expense);
            expect(result.error).toBeTruthy();
        });
        it('should be less than 25 characters', () => {
            const expense = Object.assign({}, validExpense);
            expense.habitId = "12345678901234567890123456789";
            result = validation.check(expense);
            expect(result.error).toBeTruthy();
        });
    });
    describe('needWant', () => {
        it('should exist', () => {
            const expense = Object.assign({}, validExpense);
            delete expense.needWant;
            result = validation.check(expense);
            expect(result.error).toBeTruthy();
        });
        it('should be a string', () => {
            const expense = Object.assign({}, validExpense);
            expense.needWant = 12345.5;
            result = validation.check(expense);
            expect(result.error).toBeTruthy();
        });
        it('should be between 1 and 25 characters', () => {
            const expense = Object.assign({}, validExpense);
            expense.needWant = "12345678901234567890123456789";
            result = validation.check(expense);
            expect(result.error).toBeTruthy();
        });
    });
});
