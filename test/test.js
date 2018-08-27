"use strict";
let assert = require('assert');
let transactionService = require('../service/transaction');
let Transaction = require('../models/transaction');

describe('Clerkie Interview Challenge', function() {
    let transactions = require('./data').transactions;
    after(function(done) {
        Transaction.deleteMany({}).exec();
        done();
    });

    describe('Upsert Transactions Null Input', function() {
        it('should return an array empty array', function(done) {
            this.timeout(10000);
            let emptyArray = [];
            transactionService.upsertTransactions(emptyArray,function (err, res) {
                assert.equal(null, res);
                done();
            });
        });
    });

    describe('Upsert Transactions', function() {
        it('should add array of transactions and return an array of recurring transactions', function(done) {
            this.timeout(10000);
            transactionService.upsertTransactions(transactions, function (err, res) {
                assert.equal(8, res.length);
                done();
            });
        });
    });

    describe('Get Recurring Transactions', function() {
        it('should return an array of recurring transactions with length 8', function(done) {
            this.timeout(10000);
            transactionService.getRecurringTransactions(function (err, res) {
                assert.equal(8, res.length);
                done();
            });
        });
    });

    describe('Get Recurring Transactions First Object', function() {
        it('should return an array of recurring transactions with first object as Comcast', function(done) {
            this.timeout(10000);
            transactionService.getRecurringTransactions(function (err, res) {
                assert.equal('Comcast', res[0].name);
//                assert.equal(new Date('2018-09-08'), res[0].next_date);
                assert.equal(66.41, res[0].next_amt);
                assert.equal(4, res[0].transactions.length);
                done();
            });
        });
    });
});