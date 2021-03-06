require('dotenv').config();

const bodyParser   = require('body-parser');
const cookieParser = require('cookie-parser');
const express      = require('express');
const favicon      = require('serve-favicon');
const hbs          = require('hbs');
const mongoose     = require('mongoose');
const logger       = require('morgan');
const path         = require('path');
const User         = require('./models/user')
const app          = express();
const session    = require("express-session");
const MongoStore = require("connect-mongo")(session);

const app_name = require('./package.json').name;
const debug = require('debug')(`${app_name}:${path.basename(__filename).split('.')[0]}`);

mongoose
  .connect(process.env.db, {useNewUrlParser: true, useUnifiedTopology: true})
  .then(x => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`)
  })
  .catch(err => {
    console.error('Error connecting to mongo', err)
  });

app.use(session({
  secret: "basic-auth-secret",
  cookie: { maxAge: 60000 },
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
    ttl: 24 * 60 * 60 // 1 day
  })
}));

// Middleware Setup
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/main',protect);
app.use('/private',protect);

// Express View engine setup
      
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));
hbs.registerPartials(__dirname + '/views/partials'); 

// default value for title local
app.locals.title = 'Express - Generated with IronGenerator';

// Routs
app.use('/', require('./routes/index'));
app.use('/user', require('./routes/user'));


// middleware definition
function protect (req,res,next){ 
  if (req.session.currentUser) next()
  else { res.redirect('/user/login', {
    errorMessage: "Login Required!"
    }); 
  }
}

app.use((err, req, res, next)=>{
  res.render("error.hbs", {errorMessage:err});
})

module.exports = app;


