"use strict";
const zmq = require('zeromq');
const socket = zmq.socket(`rep`);
const transactionService = require('./service/transaction');

socket.bindSync(`tcp://127.0.0.1:1984`);


/**
 *    Server listens on port:1984, expects request with specified task to generate response, and timeouts after 10 seconds.
 */

socket.on(`message`, function (msg) {

    let timeout;
    timeout = setTimeout(() => {
        let response = 'Request time out';
        socket.send(response);
        console.log('Timed out');
    }, 10000);

    let message =  JSON.parse(msg.toString());
    if(message == null)
        socket.send('Invalid Message');

    else if(message.task === 'upsert_transaction'){
        transactionService.upsertTransactions(message.transactions, function(err, recurring_transactions){
            socket.send(JSON.stringify(recurring_transactions));
            clearTimeout(timeout);
        });

    }else if(message.task === 'get_recurring_trans'){
        transactionService.getRecurringTransactions(function(err, transactions){
            socket.send(JSON.stringify(transactions));
            clearTimeout(timeout);
        });
    }else{
        console.log('Invalid Message');
    }
});

process.on('SIGINT', function() {
    socket.close();
    process.exit(0);
});