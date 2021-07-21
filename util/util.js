const contractUser = {} // use to save customizing limit for each api for each user

// {
//   peter:
//   {
//     '/': '99',
//     '/testapi1': '999',
//     '/testapi2': '9999'
//   }
// }

function setContractUser(req, res) {
  if (!contractUser[req.body.user]) { // if there is no limit setting for this user, create a new Object
    contractUser[req.body.user] = {}
  }
  contractUser[req.body.user][req.body.api] = req.body.quota
  res.sendFile('setContractUser.html', { root: 'public' })
}

module.exports = {
  setContractUser,
  contractUser
}