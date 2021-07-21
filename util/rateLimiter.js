require('dotenv').config();
const Cache = require('./cache');

const Environment = process.env;
const WINDOW = Environment.RATE_LIMIT_WINDOW
const { contractUser } = require('./util') // get the user quota limitation

function rateLimiter(user, apiPath) {
  return new Promise((resolve, reject) => {
    const token = user + apiPath // use this as the key to save in the Redis
    // check whether the user has the customized limit of specific api or not
    // if yes, use customized limit
    // if no, use defult limit set in the .env file
    const QUOTA = !contractUser[user] ?
      Environment[`RATE_LIMIT_QUOTA_${apiPath}`] || 5 : parseInt(contractUser[user][`/${apiPath}`]) || 5

    Cache.client
      .multi()
      .set([token, 0, 'EX', WINDOW, 'NX']) // if not exist, set token = 0, expire in WINDOW second
      .set([`${token}LogAt`, new Date(), 'EX', WINDOW, 'NX']) // if not exist, set the time of request 
      .incr(token) // if exist, increase the number by 1
      .exec(async (err, replies) => {
        if (err) {
          resolve({
            status: 500,
            message: 'Internal Server Error'
          });
        }

        const reqCount = replies[2]; // get the increased number

        if (reqCount > QUOTA) { // if request frequency over the limit
          const userLogAt = await Cache.get(`${token}LogAt`) // get the first request time
          // transfer string to millisecond then add WINDOW time then transfer to Date
          const avirrableTime = new Date(Date.parse(userLogAt) + WINDOW * 1000).toString()
          resolve({
            status: 429,
            message: `Quota of ${QUOTA} per ${WINDOW} sec for API "/${apiPath}" has exceeded, this API will be avirrable after ${avirrableTime}`
          });
        }
        resolve({
          status: 200,
          message: `Quota of ${QUOTA} per ${WINDOW} sec for API "/${apiPath}" has been use ${reqCount} times`
        });
      })
  })
}

const rateLimiterRoute = async (req, res, next) => {
  if (!Cache.client.ready) { // when redis not connected
    return next();
  } else {
    try {
      let user = req.query.user // get the user from query
      if (user === 'admin') { // if the user is admin
        res.status(200).send('wlecome, administrator');
        return next() // skip the rateLimiter
      }
      if (!user) { // if the user is not set
        user = req.ip; // user the ip as the user name
      }
      const apiPath = req.route.path.replace('/', '') // get the path of the API
      let result = await rateLimiter(user, apiPath);
      res.status(result.status).send(result.message);
      return next();
    } catch {
      return next();
    }
  }
};

module.exports = {
  rateLimiterRoute,
  contractUser
};