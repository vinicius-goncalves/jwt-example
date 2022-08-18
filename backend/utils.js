const getCurrentTime = () => {
    const date = new Date()

    const options = { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    }

    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date)
    return formattedDate
}

const getCurrentTimeInMilliseconds = () => {
    const currentTime = Date.now()
    return currentTime
}

const receiveDataObject = (request) => {
    return new Promise(resolve => {
        
        const buffer = []
        request.on('data', chunk => {
            buffer.push(chunk)    
        })

        request.on('end', () => {
            const bufferReceived = Buffer.concat(buffer).toString()
            const object = JSON.parse(bufferReceived)
            resolve(object)
        })
    })
}

module.exports = {
    receiveDataObject,
    getCurrentTime,
    getCurrentTimeInMilliseconds
}