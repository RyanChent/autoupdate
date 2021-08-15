exports.getMode = (mode) => {
    return ['server', 'client'].includes(mode) ? mode : 'server'
}

exports.getPort = (port) => {
    if (typeof port === 'number' || !isNaN(port)) {
       const validPort = parseInt(port)
       return Math.min(Math.max(validPort, 10000), 2 ** 16)
    } else {
       return 12345
    }
}

exports.getCommand = (command) => {
    if (Array.isArray(command)) {
        return command.join(' ')
    } else {
        throw 'please input a valid command'
    }
}