"use strict";
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const config = require('../config.json');
const databaseConfiguration = config.database;
const Schema = mongoose.Schema;

mongoose.connect(databaseConfiguration, function(err) {
    if(err)    throw err;
    console.log("database connected on ", databaseConfiguration);
});

let transactionSchema = new Schema({
    trans_id:String,
    user_id:String,
    name:String,
    amount:Number,
    date: Date,
    is_recurring:Boolean,
    transaction_cycle:Number,
    next_amt:Number
});

let Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;