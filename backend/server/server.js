const http = require('http')

const port = process.env.PORT || 8080
const routes = require('./routes')

const server = http.createServer((request, response) => {
    request.url.substring
    routes.handleRoutes(request, response)
})

server.listen(8080, () => console.log(`vinicius-goncalves.com | Server started on port ${port} at ${new Date().toString()}`))