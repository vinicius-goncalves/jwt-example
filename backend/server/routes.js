const Utils = require('../utils')
const jwt = require('jsonwebtoken')
const path = require('path')
const fs = require('fs')

const games = require('../database/games.json')

const indexPath = path.join(__dirname, '../', '../', 'frontend', 'index.html')
const tokenExpiresIn = 120

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

        // @route GET   
        case 'get':
            // @desc Send index.html to request
            if(url === '/home') {
                const file = fs.readFileSync(indexPath)
                response.writeHead(200, { 'Content-Type': 'text/html' })
                response.write(file)
                response.end()
                break
            }
            
            // @desc Verifiy to user if access token is valid
            if(url === '/games') {
                const { ['authorization']: token } = headers
                jwt.verify(token, process.env.SECRET_KEY, (error) => {
                    if(error) {
                        response.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' })
                        response.write(JSON.stringify({ message: 'Invalid token', invalid_token: true }))
                        response.end()
                        return
                    }

                    response.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
                    response.write(JSON.stringify(games))
                    response.end()
                })
                break
            }

            // @desc Refresh user access token after it has experied
            if(url === '/refreshToken') {
                const { ['authorization']: token } = headers
                jwt.verify(token, process.env.REFRESH_TOKEN_SECRET_KEY, (error) => {
                    if(error) {
                        response.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
                        response.write(JSON.stringify({ message: 'Invalid refresh token. Re-authentication must be realized.', invalid_refresh_token: true }))
                        response.end()
                        return
                    }

                    const token = jwt.sign({ 
                        tokenCreatedAt: Utils.getCurrentTimeInMilliseconds(),
                        tokenWillExpireAt: Utils.getCurrentTimeInMilliseconds() + (tokenExpiresIn * 1000)
                    }, process.env.SECRET_KEY, { expiresIn: tokenExpiresIn })

                    response.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
                    response.write(JSON.stringify({ token, invalid_refresh_token: false }))
                    response.end()
                })
                break
            }
            
            
        case 'post':
            // @desc Verifiy refresh and access token. If false for both, 
            // @desc it'll be necessary the user action re-authenticate
            if(url === '/verifyToken') {

                const tokenType = await Utils.receiveDataObject(request)

                if(!tokenType) {
                    response.end()
                    return
                }

                const { type, token } = tokenType

                switch(type) {
                    case 'accessToken':

                        const headerResponse = {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'GET',
                            'Access-Control-Max-Age': 300
                        }

                        const informationResponse = (boolean, accessOrRefreshToken, data) => ({
                            valid: boolean,
                            type: accessOrRefreshToken,
                            data
                        })
                        
                        jwt.verify(token, process.env.SECRET_KEY, (error, data) => {
                            
                            const invalidAccessToken = informationResponse(false, 'accessToken')
                            const validAccessToken = informationResponse(true, 'accessToken', data)

                            if(error) {
                                //! Why 200 status code? Due to we just want to verify the token, and
                                //! we need to get the response without errors. 
                                //! In other words, we aren't sign in or something looks like it, then
                                //! there are no reasons to send code status 4xx like (400 - Bad Request).
                                response.writeHead(200, headerResponse)
                                response.write(JSON.stringify(invalidAccessToken))
                                response.end()
                                return
                            }

                            response.writeHead(200, headerResponse)
                            response.write(JSON.stringify(validAccessToken))
                            response.end()
                        })
                        break

                    case 'refreshToken':
                        jwt.verify(token, process.env.REFRESH_TOKEN_SECRET_KEY, (error) => {
                            if(error) {
                                
                                response.writeHead(200, { 
                                    'Content-Type': 'application/json' ,
                                    'Access-Control-Allow-Origin': '*',
                                    'Access-Control-Allow-Methods': 'GET',
                                    'Access-Control-Max-Age': 300
                                })

                                response.write(JSON.stringify({ valid: false, type: 'refreshToken' }))
                                response.end()
                                return
                            }

                            response.writeHead(200, { 
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            })
                            response.write(JSON.stringify({ valid: true, type: 'refreshToken' }))
                            response.end()
                        })
                        break

                    default:
                        break
                }
                break
            }
            
            if(url === '/login') {
                const userDetails = await Utils.receiveDataObject(request)
                const { login, password } = userDetails
                if(login === 'admin' && password === 'admin') {

                    const token = jwt.sign({  
                        tokenCreatedAt: Utils.getCurrentTimeInMilliseconds(),
                        tokenWillExpireAt: Utils.getCurrentTimeInMilliseconds() + (tokenExpiresIn * 1000)
                    }, process.env.SECRET_KEY, { expiresIn: tokenExpiresIn, subject: 'accessToken' })

                    const refreshToken = jwt.sign({
                        refreshTokenCreatedAt: Utils.getCurrentTimeInMilliseconds()
                    }, process.env.REFRESH_TOKEN_SECRET_KEY, { expiresIn: 60, subject: 'refreshToken' })

                    response.writeHead(200, { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    })
                    
                    response.write(JSON.stringify({ accessToken: token, refreshToken, createdAt: Utils.getCurrentTimeInMilliseconds() }, null, 2))
                    response.end()
                    return
                }

                response.writeHead(401, { 
                    'Content-Type': 'application/json', 
                    'Access-Control-Allow-Origin': '*' 
                })
                response.write(JSON.stringify({ message: 'Username and/or password incorrect.'}))
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