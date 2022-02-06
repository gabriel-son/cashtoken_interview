require('dotenv').config();
const express = require('express');
const app = express();
const router = express.Router();
const {home, userProfile: profile, dashboard, callback, snapchatAuth, cashtokenAuth, logout} = require('./controller');
const {port} = require('./config')

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// set the view engine to ejs
app.set('view engine', 'ejs');

// Route for kanding page
router.get('/', home);

// User dashboard
router.get('/dashboard', dashboard)

// Callback route for snapchat
router.get('/snapchat', (req, res, next) => {
  req.query.snapchat = true
  next()
}, callback)

// call back route for cashtoken auth
router.get('/callback', callback)

// snapchat authenticator route
router.get('/auth/snapchat', snapchatAuth)
// cashtoken authenticatoe route
router.get('/auth/cashtoken', cashtokenAuth)
// user profile route
router.get('/user_profile', profile)
// signout route
router.get('/signout', logout)

// Application router
app.use('/', router);
app.listen(port, ()=> {
    console.log('Listening on port ' + port)
})
