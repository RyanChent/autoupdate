/**
 * env: client
 */
const http = require('http')
const {
    execSync,
} = require('child_process')
const chalk = require('chalk')
const {
    readFileSync,
    appendFileSync
} = require('fs')

let server, ws, index

const createServer = (port) => {
    const server = http.createServer((req, res) => {
        console.log(req.url)
        res.end('testPage')
    })
    server.listen(port, () => {
        console.log(chalk.green(`The web page is running on http://localhost:${port}`))
        execSync(`start http://localhost:${port}`)
    })
    return server
}

process.on('message', ({
    port,
    message,
    url
}) => {
    if (!server && message === 'init') {
        server = createServer(port)
    } else if (message === 'update') {
        console.log(server)
        console.log(readFileSync(url, 'utf-8'))
    }
})

process.on('beforeExit', (status) => {
    server && server.close()
    server = null
    process.exit(1)
})