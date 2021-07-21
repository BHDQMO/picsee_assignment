
const express = require('express')
const app = express()
app.use(express.static('public'));
app.use(express.urlencoded({
  extended: true
}));

const {
  rateLimiterRoute
} = require('./util/rateLimiter')

const {
  setContractUser
} = require('./util/util')

app.get('/', rateLimiterRoute)
app.get('/testapi1', rateLimiterRoute)
app.get('/testapi2', rateLimiterRoute)
app.get('/testapi3', rateLimiterRoute)
app.get('/testapi4', rateLimiterRoute) // does't have qutoa in env file. will use defult value

// "127.0.0.1:3000/setContractUser.html" is a simple web-page for customizing limit for each api for each user
app.post('/setContractUser', setContractUser)

app.use(function (err, req, res, next) {
  console.log(err);
  res.status(500).send('Internal Server Error');
});

app.listen(3000, () => {
  console.log(`Server is running`);
});