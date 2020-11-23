// environment variables
require('dotenv').config()

const mongoose = require('mongoose');
const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook');
const findOrCreate = require('mongoose-findorcreate');
const LocalStrategy = require('passport-local').Strategy;

// encryption level 3
// hashing your message
// const md5 = require('md5');

// encryption level 4
// hashing + salting
// const bcrypt = require('bcrypt');
// const saltRounds = 10;

//tell our app to use EJS
app.set('view engine', 'ejs');

//tell express serever to use static file called "public" or whatever
app.use(express.static('public'));

//tell our app to use EJS
app.set('view engine', 'ejs');

//tell our app to use body-parser
app.use(bodyParser.urlencoded({extended: true}));

// encryption level 5
// session
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));

// use passport to make cookie
app.use(passport.initialize());
app.use(passport.session());

// ########################################## MongoDB ##########################################
// getting-started.js


// connect to DB
mongoose.connect('mongodb://localhost/usersDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set('useCreateIndex', true);

//a connection to database
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected to the server');
});

// ############## encryption ##############
// const encrypt = require('mongoose-encryption');

//schema
const usersSchema = new mongoose.Schema({
  username: String,
  password: String,
  googleId: String,
  facebookId: String

});

// var secret = process.env.MY_SECRET;

// usersSchema.plugin(encrypt, { secret: secret, encryptedFields: ['password'] } );
// ############## encryption ##############

// encryption level 5
// session
usersSchema.plugin(passportLocalMongoose);
usersSchema.plugin(findOrCreate);

//model
const User = mongoose.model('User', usersSchema);

// ########################################## MongoDB ##########################################

// Local STRATEGY
passport.use(User.createStrategy());

// local STRATEGY
// passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// not local
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


// GOOGLE STRATEGY
passport.use(new GoogleStrategy(
  {
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile._json);

    User.findOne({ googleId: profile.id }, (err, user) => {
      if (!user) {
        const user = new User ({
          username: profile.displayName,
          password: String,
          googleId: profile.id
        });
        user.save((err) => {
          if (!err) {
            return cb(err, user);
          }
        });
      } else {
        return cb(err, user);
      }
    });

    // User.findOrCreate({ googleId: profile.id }, function (err, user) {
    //   return cb(err, user);
    // });
  }
));

// FACEBOOK STRATEGY
passport.use(new FacebookStrategy({
    clientID: process.env.FB_APP_ID,
    clientSecret: process.env.FB_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, cb) {

    User.findOne({ facebookId: profile.id }, (err, user) => {
      if (!user) {
        const user = new User ({
          username: profile.displayName,
          facebookId: profile.id
        });
        user.save((err) => {
          if (!err) {
            return cb(err, user);
          }
        });
      } else {
        return cb(err, user);
      }
    });

    // User.findOrCreate({ facebookId: profile.id }, function (err, user) {
    //   return cb(err, user);
    // });
  }
));

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

app.get('/secrets', (req, res) => {

  if (req.isAuthenticated()) {
    res.render('secrets');
  } else {
    console.log(req.isAuthenticated());
    res.redirect('/login');
  }

});

// google
app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
passport.authenticate('google', { failureRedirect: '/login' }),
function(req, res) {
// Successful authentication, redirect home.
  res.redirect('/secrets');
});

// facebook
app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
passport.authenticate('facebook', { failureRedirect: '/login' }),
function(req, res) {
  // Successful authentication, redirect home.
  res.redirect('/secrets');
});

app.post('/register', (req, res) => {

  User.register({username: req.body.username}, req.body.password, (err, user) => {
    if(err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect('/secrets');
      });
    }

  });

});

app.post('/login', (req, res) => {


  const user = new User ({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, (err, user) => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate('local', (err, user, info) => {
        if (user) {
          res.redirect('/secrets');
        } else if (!user) {
          console.log(user);
          res.render('error');
        }
      })(req, res);
    }

  });

});

// listening port
app.listen(process.env.PORT || port, () => {
  console.log('Server is running on port ' + port);
});
