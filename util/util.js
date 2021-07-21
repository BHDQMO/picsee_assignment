const contractUser = {}

function setContractUser(req, res) {
  if (!contractUser[req.body.user]) {
    contractUser[req.body.user] = {}
  }
  contractUser[req.body.user][req.body.api] = req.body.quota
  console.log(contractUser)
  res.sendFile('setContractUser.html', { root: 'public' })
}

module.exports = {
  setContractUser,
  contractUser
}