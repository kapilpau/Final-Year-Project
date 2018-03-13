var express = require('express');
var router = express.Router();

var expressValidator = require('express-validator');
var passport = require('passport');
var sqlite = require('sqlite-sync');
var bcrypt = require('bcrypt');
const saltRounds = 10;

var events = require('events');

var eventEmitter = new events.EventEmitter();



/*var datepicker = require('js-datepicker');
const picker = datepicker(selector, options);*/
sqlite.connect(__dirname + '/../db/meetings.db');
/* GET home page. */
router.get('/', function (req, res) {
    console.log(req.user);
    console.log(req.isAuthenticated());
    res.render('Homepage', {title: 'Homepage'});
});

/* GET dashboard page. */
router.get('/dashboard', authenticationMiddleware(), function (req,res) {
    console.log('Got dashboard');
    res.render('dashboard', {title: 'Dashboard'});
});

/* GET login page. */
router.get('/login', function (req, res, next) {
    res.render('login', {title: 'Login'});
});

router.post('/login', passport.authenticate('local', {successRedirect: '/dashboard', failureRedirect:'/login'}));

/* GET logout page. */
router.get('/logout', function (req, res, next) {
    req.logout();
    req.session.destroy();
    res.redirect('/');
});

/* GET Register page. */
router.get('/register', function (req, res, next) {
    res.render('register', {title: 'Registration'});
});

/* POST Register page. */
router.post('/register', function (req, res, next) {

    req.checkBody('username', 'Username field cannot be empty.').notEmpty();
    req.checkBody('username', 'Username must be between 4-15 characters long.').len(4, 15);
    req.checkBody('email', 'The email you entered is invalid, please try again.').isEmail();
    req.checkBody('email', 'Email address must be between 4-100 characters long, please try again.').len(4, 100);
    req.checkBody('password', 'Password must be between 8-100 characters long.').len(8, 100);
    req.checkBody("password", "Password must include one lowercase character, one uppercase character, a number, and a special character.").matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.* )(?=.*[^a-zA-Z0-9]).{8,}$/, "i");
    req.checkBody('passwordMatch', 'Password must be between 8-100 characters long.').len(8, 100);
    req.checkBody('passwordMatch', 'Passwords do not match, please try again.').equals(req.body.password);

    const errors = req.validationErrors();

    if (errors) {
        console.log(`errors: ${JSON.stringify(errors)}`);

        res.render('register', {
            title: 'Registration Error',
            errors: errors
        });
    } else {
        const username = req.body.username;
        const email = req.body.email;
        const password = req.body.password;



        bcrypt.hash(password, saltRounds, function (err, hash) {
            sqlite.run("INSERT INTO users (username, email, password) VALUES ('"+username+"', '"+ email +"', '"+hash+"')", function (results){
                if (results.error) throw res.error;
                sqlite.run('SELECT LAST_INSERT_ID() as user_id', function (res) {
                    if (res.error) throw res.error;
                    console.log(JSON.stringify(res))
                    const user_id = res[0];

                    console.log(results[0]);
                    req.login(user_id, function (err) {
                        res.redirect('/');
                    });
                });

                res.render('register', {title: 'Registration Complete'});
            })
        });
    }
});

passport.serializeUser(function (user_id, done) {
    done(null, user_id);
});

passport.deserializeUser(function (user_id, done) {
    done(null, user_id);
});

function authenticationMiddleware () {
    return (req, res, next) => {
        console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport.user)}`);
        console.log(req.isAuthenticated());
        if (req.isAuthenticated()) return next();
        res.redirect('/login')
    }
}

/* GET meetings page. */
router.get('/meeting/:id', authenticationMiddleware(), function (req,res) {
    res.render('meeting', {title: 'Meeting '});
});

/* GET meetings page. */
router.get('/meeting', authenticationMiddleware(), function (req,res) {
    res.render('meeting', {title: 'Meeting '});

});

module.exports = router;
