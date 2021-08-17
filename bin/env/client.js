/**
 * env: client
 */
const http = require('http')
const {
    execSync,
} = require('child_process')
const chalk = require('chalk')
const {
    readFileSync
} = require('fs')
const {
    join
} = require('path')
const io = require('socket.io')
const mime = require('mime/lite')
const { findFile } = require('../utils')

let server, ws, portDefault = 12345, index = `<html>
  <head>
    <title>404 Not Found</title>
  </head>
  <body>
    <div>404 Not Found</div>
  </body>
</html>`

const serverError = () => {
    console.log(chalk.redBright(`The port is used, server is restart on a new port`))
    server && server.close()
    portDefault += 1
    server.listen(portDefault, '0.0.0.0', () => {
        console.log(chalk.greenBright(`The web page is running on http://localhost:${portDefault}`))
    })
    ws = io(server, {
        allowEIO3: true,
    })
}

const createServer = (port, url) => {
    portDefault = port
    const server = http.createServer((req, res) => {
        res.writeHead(200)
        if (req.url === '/') {
            res.end(index.replace('</body>', `<script src="https://cdn.jsdelivr.net/npm/socket.io-client@2/dist/socket.io.js"></script>
            <script type="text/javascript">
window.onload = () => {
    const ws = io('http://localhost:${portDefault}')
    ws.on('news', () => {
        location.reload()
    })
}
</script>
</body>`))
        } else {
            res.end(join(url, req.url))
        }
    })
    server.listen(portDefault, '0.0.0.0', () => {
        console.log(chalk.greenBright(`The web page is running on http://localhost:${portDefault}`))
    })
    server.on('error', serverError)
    ws = io(server, {
        allowEIO3: true,
    })
    execSync(`start http://localhost:${portDefault}`)
    return server
}

module.exports = {
    message: ({ port, message, url }) => {
        if (!server && message === 'init') {
            const filepath = findFile(undefined, 'text/html', 'index.html')
            if (filepath) {
                index = readFileSync(filepath, 'utf-8')
            }
            server = createServer(port, url)
        } else if (message === 'update') {
            console.log(chalk.yellowBright(`file ${url} changed, and the page will reload`))
            const content = readFileSync(url, 'utf-8')
            if (mime.getType(url) === 'text/html' && index != content) {
                index = content
            }
            ws.emit && ws.emit('news')
        }
    },
    exit: () => {
        server && server.close()
        ws && ws.close()
        ws = null
        server = null
    }
}