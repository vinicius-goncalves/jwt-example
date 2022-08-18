const Utils = require('../utils')
const jwt = require('jsonwebtoken')
const path = require('path')
const fs = require('fs')

const games = require('../database/games.json')

const indexPath = path.join(__dirname, '../', '../', 'frontend', 'index.html')

const handleRoutes = async (request, response) => {

    const { url, method, headers } = request
    
    switch(method.toLowerCase()) {
        case 'options':
            response.writeHead(200, { 
                'Access-Control-Allow-Origin': '*', 
                'Access-Control-Max-Age': 86400, 
                'Access-Control-Allow-Methods': 'GET, POST',
                'Access-Control-Allow-Headers': '*' 
            })
            response.end()
            break
        case 'get':
            if(url === '/home') {
                const file = fs.readFileSync(indexPath)
                response.writeHead(200, { 'Content-Type': 'text/html' })
                response.write(file)
                response.end()
                break
            }
            
            if(url === '/games') {
                const { ['authorization']: token } = headers
                jwt.verify(token, process.env.SECRET_KEY, (error) => {
                    if(error) {
                        response.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' })
                        response.write(JSON.stringify({ message: 'Invalid token' }))
                        response.end()
                        return
                    }

                    response.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
                    response.write(JSON.stringify(games))
                    response.end()
                })
                break
            }

            if(url === '/refreshToken') {
                const { ['authorization']: token } = headers
                jwt.verify(token, process.env.REFRESH_TOKEN_SECRET_KEY, (error) => {
                    if(error) {
                        response.writeHead(401, { 'Content-Type': 'application/json' })
                        response.write(JSON.stringify({ message: 'Invalid refresh token'}))
                        response.end()
                        return
                    }

                    const token = jwt.sign({ 
                        tokenCreatedAt: Utils.getCurrentTimeInMilliseconds()
                    }, process.env.SECRET_KEY, { expiresIn: 15 })

                    response.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
                    response.write(JSON.stringify({ token }))
                    response.end()
                })
                break
            }

        case 'post':
            if(url === '/login') {
                const userDetails = await Utils.receiveDataObject(request)
                const { login, password } = userDetails
                if(login === 'admin' && password === 'admin') {

                    const token = jwt.sign({  
                        tokenCreatedAt: Utils.getCurrentTimeInMilliseconds() 
                    }, process.env.SECRET_KEY, { expiresIn: 30, subject: 'admin' })

                    const refreshToken = jwt.sign({
                        refreshTokenCreatedAt: Utils.getCurrentTimeInMilliseconds()
                    }, process.env.REFRESH_TOKEN_SECRET_KEY, { expiresIn: 86400, subject: 'admin' })

                    response.writeHead(200, { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    })
                    response.write(JSON.stringify({ accessToken: token, refreshToken, createdAt: Utils.getCurrentTimeInMilliseconds() }, null, 2))
                    response.end()
                    break
                }

                response.writeHead(401, { 
                    'Content-Type': 'application/json', 
                    'Access-Control-Allow-Origin': '*' 
                })
                response.write(JSON.stringify({ message: 'username and/or password incorrect.'}))
                response.end()
                break
            }
        default:
            response.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
            response.write(JSON.stringify({ message: 'Page or route not found' }))
            response.end()
            break
    }
}

module.exports = {
    handleRoutes
}