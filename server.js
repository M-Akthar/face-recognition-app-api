const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex')

const db = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'ptest123', //This is a throw away password. I don't like how it's here for the
        // whole world to see. A more secure method must exist and for professional applications
        // you will need to figure it out.
        database: 'face-recognition'
    }
});

// db.select('*').from('users').then(data => {
//     console.log(data);
// });

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send(database.users);
})

//Signin
app.post('/signin', (req, res) => {

    // // Load hash from your password DB.
    // bcrypt.compare("bacon", hash, function (err, res) {
    //     // res == true
    // });
    // bcrypt.compare("veggies", hash, function (err, res) {
    //     // res = false
    // });

    db.select('email', 'hash').from('login')
        .where('email', '=', req.body.email)
        .then(data => {
           const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
           if(isValid) {
               return db.select('*').from('users')
                   .where('email', '=', req.body.email)
                   .then(user => {
                       res.json(user[0])
                   })
                   .catch(err => res.status(400).json('Unable to get user'))
           } else {
               res.status(400).json('wrong credentials')
           }
        })
        .catch(err => res.status(400).json('Wrong credentials'))
})

//Register
app.post('/register', (req, res) => {
    const { email, password, name } = req.body;
    const hash = bcrypt.hashSync(password);

        db.transaction(trx => {
            trx.insert({
                hash: hash,
                email: email,
            })
            .into('login')
            .returning('email')
            .then(loginemail => {
                return trx('users')
                    .returning('*')
                    .insert({
                        email: loginemail[0],
                        name: name,
                        joined: new Date()
                    })
                    .then(user => {
                        res.json(user[0]);
                    })
            })
            .then(trx.commit)
            .catch(trx.rollback)
        })
        .catch(err => res.status(400).json('Unable to register'))
})

app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    db.select('*').from('users').where({
        id: id
    })
        .then(user => {
            if(user.length) {
                res.json(user[0])
            } else {
                res.status(400).json('Not found')
            }
        })
        .catch(err => res.status(400).json('Error getting user'))

})

app.put('/image', (req, res) => {
    const { id } = req.body;
    db('users').where('id', '=', id)
        .increment('entries', 1)
        .returning('entries')
        .then(entries => {
            res.json(entries[0]);
        })
        .catch(err => res.status(400).json('Unable to get entries'))
})

// bcrypt.hash(password, null, null, function (err, hash) {
//     // Store hash in your password DB.
//     console.log(hash);
// });

app.listen(4000, () => {
    console.log('app is running on port 4000');
})

/*

/ --> res = this is working
/ signin --> POST = success/fail
/register --> POST = user
/profile/:userId --> GET = user
/image --> PUT --> user

*/