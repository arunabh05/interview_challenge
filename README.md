# interview_challenge
Interview Challenge - Backend Engineer


Protocol : TCP

Port : 1984

## Transaction Model
Partial definition of Transaction model:
```javascript
{
    trans_id:String,
    user_id:String,
    name:String,
    amount:Number,
    date: Date,
    is_recurring:Boolean,
    transaction_cycle:Number,
    next_amt:Number
}
```


## API Description


**_1. Upsert Transactions_**

Adds new transactions into the database, and returns an array of recurring_transactions. 

__Input__: 
```javascript
{
  transactions:[],
  task:"upsert_transactions"
}
```


__Output__: 
```javascript
[
  {
    "name": "Comcast",
    "user_id": "1",
    "next_amt": 66.41,
    "next_date": "2018-09-08T07:00:00.000Z",
    "transactions": [
      {
        "_id": "5b8478362534fd386c50b142",
        "name": "Comcast",
        "date": "2018-05-08T07:00:00.000Z",
        "amount": 63.25,
        "trans_id": "19",
        "user_id": "1",
        "next_amt": 63.25,
        "is_recurring": true,
        "__v": 0
      },
      ...
  },
  ...
]
```

**_2. Get recurring transactions_**

Returns an array of recurring transactions, with next_date, and next_amount. 

__Input__: 
```javascript
{
  task:"get_recurring_trans"
}
```

__Output__: 
```javascript
[
  {
    "name": "Comcast",
    "user_id": "1",
    "next_amt": 66.41,
    "next_date": "2018-09-08T07:00:00.000Z",
    "transactions": [
      {
        "_id": "5b8478362534fd386c50b142",
        "name": "Comcast",
        "date": "2018-05-08T07:00:00.000Z",
        "amount": 63.25,
        "trans_id": "19",
        "user_id": "1",
        "next_amt": 63.25,
        "is_recurring": true,
        "__v": 0
      },
      ...
  },
  ...
]
```


**Note**: _The server time outs after 10 seconds._.
