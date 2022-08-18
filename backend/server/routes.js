const Utils = require('../utils')
const jwt = require('jsonwebtoken')

const games = require('../database/games.json')

const handleRoutes = async (request, response) => {

    const { url, method, headers } = request

    switch(method.toLowerCase()) {
        case 'get': {
            if(url === '/games') {
                
                const { ['authorization']: token } = headers
                jwt.verify(token, process.env.SECRET_KEY, (error) => {
                    if(error) {
                        response.writeHead(401, { 'Content-Type': 'application/json' })
                        response.write(JSON.stringify({ message: 'Invalid token' }))
                        response.end()
                        return
                    }

                    response.writeHead(200, { 'Content-Type': 'application/json' })
                    response.write(JSON.stringify(games))
                    response.end()
                })
                break
            }
        }
        case 'post':
            if(url === '/login') {
                const userDetails = await Utils.receiveDataObject(request)
                const { login, password } = userDetails
                if(login === 'admin' && password === 'admin') {

                    const token = jwt.sign({  
                        tokenCreatedAt: Utils.getCurrentTime() 
                    }, process.env.SECRET_KEY, { expiresIn: 300, subject: 'admin' })

                    const refreshToken = jwt.sign({
                        refreshTokenCreatedAt: Utils.getCurrentTime()
                    }, process.env.REFRESH_TOKEN_SECRET_KEY, { expiresIn: 86400, subject: 'admin' })

                    response.writeHead(200, { 'Content-Type': 'application/json' })
                    response.write(JSON.stringify({ token, refreshToken, user: 'admin' }, null, 2))
                    response.end()
                    break
                }

                response.writeHead(401, { 'Content-Type': 'application/json' })
                response.end()
                break
            }
        default:
            response.writeHead(404, { 'Content-Type': 'application/json' })
            response.write(JSON.stringify({ message: 'Page not found' }, null, 2))
            response.end()
            break
    }
}

module.exports = {
    handleRoutes
}