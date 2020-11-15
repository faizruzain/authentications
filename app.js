const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');

//tell our app to use EJS
app.set('view engine', 'ejs');

//tell express serever to use static file called "public" or whatever
app.use(express.static('public'));

//tell our app to use EJS
app.set('view engine', 'ejs');

//tell our app to use body-parser
app.use(bodyParser.urlencoded({extended: true}));

// ########################################## MongoDB ##########################################
// getting-started.js
const mongoose = require('mongoose');

// connect to DB
mongoose.connect('mongodb://localhost/usersDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

//a connection to database
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected to the server');
});

// ############## encryption ##############
const encrypt = require('mongoose-encryption');

//schema
const usersSchema = new mongoose.Schema({
  email: String,
  password: String

});

var secret = '$=DMY9+PfzlG3N3vN*!4L(FH^Q3MOJ2a';

usersSchema.plugin(encrypt, { secret: secret, encryptedFields: ['password'] } );
// ############## encryption ##############

//model
const User = mongoose.model('User', usersSchema);

// ########################################## MongoDB ##########################################

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {

  const email = req.body.email;
  const password = req.body.password;

  const newUser = new User ({
    email: email,
    password: password
  });

  newUser.save((err) => {
    if (!err) {
      console.log('Saved!');
      res.render('secrets');
    } else {
      res.send(err);
    }
  });

});

app.post('/login', (req, res) => {

  const email = req.body.email;
  const password = req.body.password;

  User.findOne(
    {
      email: email
    },
    (err, doc) => {
      if (doc) {
        if (doc.password === password) {
          res.render('secrets');
        } else {
          res.send('Incorrect email/password');
        }
      } else if (!doc) {
        res.render('notfound');
      } else {
        console.log(err);
      }
    }
  );

});













// listening port
app.listen(process.env.PORT || port, () => {
  console.log('Server is running on port ' + port);
});
