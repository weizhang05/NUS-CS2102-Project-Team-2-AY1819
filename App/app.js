var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var flash = require('connect-flash');
var session = require('express-session');
require("dotenv").load();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var loginRouter = require('./routes/login');
var registerRouter = require('./routes/register');
var restaurantsRouter = require('./routes/restaurants');
var adminRouter = require('./routes/admin');
var aboutRouter = require('./routes/about');

var customersRouter = require('./routes/customers');

var reservationRouter = require('./routes/reservation');
//var selectRestaurantRouter = require('./routes/selectRestaurant');
//var selectBranchRouter = require('./routes/selectBranch');
//var makeReservation = require('./routes/makeReservation');
var customerRouter = require('./routes/customer');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({secret: 'keyboard cat'}));
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/customer', customerRouter);
app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use('/restaurants', restaurantsRouter);
app.use('/admin', adminRouter);
app.use('/about', aboutRouter);

app.use('/reservation', reservationRouter);
//app.use('/selectRestaurant', selectRestaurantRouter);
//app.use('/selectBranch', selectBranchRouter);
//app.use('/makeReservation', makeReservation);

app.use('/customers', customersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
