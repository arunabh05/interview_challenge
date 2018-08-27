"use strict";
const Transaction = require('../models/transaction');
const ONE_DAY = (1000 * 60 * 60 * 24);

/**
 *  Returns an array of recurring transactions;
 */

exports.getRecurringTransactions = function (callback) {

    getRecurringTransactionsByNameAndUserId(function (err, recurringTransactions) {
        if (err) callback(err, null);
        else callback(null, recurringTransactions);
    });
};


/**
 * Upserts array of transactions and returns an array of recurring transactions.
 */

exports.upsertTransactions = function (transactions, callback) {

    if(Object.keys(transactions).length === 0 ||transactions === null || transactions.length === 0){
        getRecurringTransactionsByNameAndUserId(function (err, recurringTransactions) {
            if(err) callback(err, null);
            else callback(null, recurringTransactions);
        });
    }else{
        let insertTransactions = transactions.reduce((promiseChain, transaction) => {
            return promiseChain.then(() => new Promise((resolve) => {
                insertTransaction(transaction, resolve);
            }));
        }, Promise.resolve());

        insertTransactions.then(() => getRecurringTransactionsByNameAndUserId(function (err, recurringTransactions) {
            if(err) callback(err, null);
            else callback(null, recurringTransactions);
        }));
    }
};


/**
 *  Calculates the transaction recurring cycle, next amount and inserts the transaction into the database.
 */

let insertTransaction = function (transaction, callback) {

    let transactionName = transaction.name.replace(/[a-z]*\d+[a-z]*/gi, '');
    let maxAmount = transaction.amount * 2;
    let minAmount = transaction.amount / 2;

    if (transaction.amount < 0) {
        let temp = maxAmount;
        maxAmount = minAmount;
        minAmount = temp;
    }

    Transaction.find({
        name: {$regex: transactionName},
        user_id: transaction.user_id,
        amount: {$lte: maxAmount, $gte: minAmount},
    }).sort({date: -1}).exec(function (err, databaseTransactions) {

        if (err) {
            console.log(err);
            callback();
        }

        let lastTransactionDate, transactionCycle, noOfTransactions = 1;
        let currentTransactionChain = [];
        let nextAmount = transaction.amount;

        transaction.date = new Date(transaction.date);


        databaseTransactions.forEach(function (dbTransaction) {
            if (lastTransactionDate == null) {

                nextAmount += dbTransaction.amount;
                noOfTransactions++;
                transaction.is_recurring = true;
                lastTransactionDate = dbTransaction.date;
                transactionCycle = transaction.date.getTime() / ONE_DAY - dbTransaction.date.getTime() / ONE_DAY;
                transaction.transaction_cycle = transactionCycle;

                if (!dbTransaction.is_recurring) {
                    dbTransaction.is_recurring = true;
                    dbTransaction.save();
                }

                if (dbTransaction.transaction_cycle) {
                    transaction.transaction_cycle += dbTransaction.transaction_cycle;
                    transaction.transaction_cycle = transaction.transaction_cycle / noOfTransactions;
                    transaction.transaction_cycle = Math.round(transaction.transaction_cycle);
                }
                currentTransactionChain.push(transaction);
                currentTransactionChain.push(dbTransaction);
            }
            else {
                if ((lastTransactionDate.getTime() / ONE_DAY - dbTransaction.date.getTime() / ONE_DAY >= transactionCycle - 15 &&
                    lastTransactionDate.getTime() / ONE_DAY - dbTransaction.date.getTime() / ONE_DAY <= transactionCycle + 15)) {

                    currentTransactionChain.push(dbTransaction);

                } else {
                    noOfTransactions = 1;
                    currentTransactionChain = [];
                }
                lastTransactionDate = dbTransaction.date;
            }
        });

        if (noOfTransactions > 1)
            transaction.next_amt = (nextAmount / noOfTransactions).toFixed(2);
        else
            transaction.next_amt = (transaction.amount).toFixed(2);
        transaction.is_recurring = currentTransactionChain.length > 0;

        let t = new Transaction(transaction);
        t.save(transaction, function (err) {
            if (err)
                console.log(err);
            callback();
        });
    });
};


/**
 * Returns an array of recurring transactions in the database, groups them by user_id and transactions_name, and filters
 * updates recurring transactions.
 */

let getRecurringTransactionsByNameAndUserId = function (callback) {

    let recurringTransactionList = [];
    Transaction.find({is_recurring: true}, function (err, dbTransactions) {
        if (err || dbTransactions.length === 0) callback(err, null);
        else {
            let transactionsByUserId = groupBy(dbTransactions, function (item) {
                return [item.user_id, item.name.replace(/[a-z]*\d+[a-z]*/gi, '')];
            });

            let filterTransactions = transactionsByUserId.reduce((promiseChain, transaction) => {
                return promiseChain.then(() => new Promise((resolve) => {
                    generateRecurringTransactions(recurringTransactionList, transaction, resolve);
                }));
            }, Promise.resolve());

            filterTransactions.then(function (recurringTransactionList) {
                recurringTransactionList.sort(function(a, b){
                    if(a.name < b.name) return -1;
                    if(a.name > b.name) return 1;
                    return 0;
                });
                callback(null, recurringTransactionList);
            });
        }
    });
};


/**
 * Adds a recurring_transaction object in the array, after filtering them based on recurring cycle.
 */

let generateRecurringTransactions = function (recurringTransactionList, transaction, callback) {

    let lastTransaction = transaction[transaction.length - 1];
    let nextDate = getNextTransactionDate(lastTransaction.date, lastTransaction.transaction_cycle);

    // Filters transactions that are no longer following the recurring cycle.
    let today = new Date();
    if ((today.getTime() / ONE_DAY - lastTransaction.date.getTime() / ONE_DAY >= lastTransaction.transaction_cycle + 15)) {

        lastTransaction.is_recurring = false;
        lastTransaction.save(function (err) {
            if (err)
                console.log(err);
            callback(recurringTransactionList);
        });
    } else {
        let recurringTransaction = {};
        recurringTransaction.name = lastTransaction.name;
        recurringTransaction.user_id = lastTransaction.user_id;
        recurringTransaction.next_amt = lastTransaction.next_amt;
        recurringTransaction.next_date = nextDate;
        recurringTransaction.transactions = transaction;

        recurringTransactionList.push(recurringTransaction);
        callback(recurringTransactionList);
    }
};

/**
 * Returns a new Date, for the next_date of transaction.
 */

let getNextTransactionDate = function (date, transactionCycle) {
    let nextDate = new Date(date);
    nextDate = new Date(nextDate.setDate((nextDate.getDate() + transactionCycle)));
    return nextDate;
};

/**
 * This function to groups transactions by transaction name and then map them with user_id.
 */

function groupBy(array, f) {

    let groups = {};
    array.forEach(function (o) {
        let group = JSON.stringify(f(o));
        groups[group] = groups[group] || [];
        groups[group].push(o);
    });

    return Object.keys(groups).map(function (group) {
        return groups[group];
    })
}