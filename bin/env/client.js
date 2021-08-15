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
const webSocket = require('ws').Server
const mime = require('mime/lite')

let server, ws, index

const createServer = (port, url) => {
    const server = http.createServer((req, res) => {
        res.writeHead(200)
        if (req.url === '/') {
            res.end(index.replace('</body>', `<script type="text/javascript">
                window.onload = () => {
                    const ws = new WebSocket('ws://localhost:${port}')
                    ws.onopen = () => {
                        console.log(ws)
                        ws.onmessage = (message) => {
                            console.log(message)
                            location.reload()
                        }
                    }
                }
            </script>
            </body>`))
        } else {
            res.end(join(url, req.url))
        }
    })
    if (!ws) {
        ws = new webSocket({ server })
        ws.on('connection', () => {
            console.log(chalk.green('server socket is on'))
            ws.on('message', console.log)
        })
    }
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
        server = createServer(port, url)
    } else if (message === 'update') {
        console.log(chalk.yellowBright(`file ${url} changed, and the page will be reload`))
        if (mime.getType(url) === 'text/html') {
            index = readFileSync(url, 'utf-8')
        }
        if (ws && ws.send) {
            ws.send('reload')
        }
    }
})

process.on('beforeExit', (status) => {
    server && server.close()
    server = null
    process.exit(1)
})