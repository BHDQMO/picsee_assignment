require('dotenv').config();
const Cache = require('./cache');

const Environment = process.env;
const WINDOW = Environment.RATE_LIMIT_WINDOW
const { contractUser } = require('./util')

function rateLimiter(user, apiPath) {
  return new Promise((resolve, reject) => {
    const token = user + apiPath
    const QUOTA = !contractUser[user] ? Environment[`RATE_LIMIT_QUOTA_${apiPath}`] || 5 : parseInt(contractUser[user][`/${apiPath}`])

    Cache.client
      .multi()
      .set([token, 0, 'EX', WINDOW, 'NX'])
      .set([`${token}LogAt`, new Date(), 'EX', WINDOW, 'NX'])
      .incr(token)
      .exec(async (err, replies) => {
        if (err) {
          resolve({
            status: 500,
            message: 'Internal Server Error'
          });
        }

        const reqCount = replies[2];
        const userLogAt = await Cache.get(`${token}LogAt`)
        const avirrableTime = new Date(Date.parse(userLogAt) + WINDOW * 1000).toString()

        if (reqCount > QUOTA) {
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
      let user = req.query.user
      if (user === 'admin') {
        res.status(200).send('wlecome, administrator');
        return next()
      }
      if (!user) {
        user = req.ip;
      }
      const apiPath = req.route.path.replace('/', '')
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