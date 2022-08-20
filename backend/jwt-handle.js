const jwt = require('jsonwebtoken')

const signJwt = (payload, secrectOrPrivateKey, subject, expiresIn) => {
    const token = jwt.sign({ ...payload }, 
            secrectOrPrivateKey, { subject, expiresIn })
    return token
}

module.exports = {
    signJwt
}