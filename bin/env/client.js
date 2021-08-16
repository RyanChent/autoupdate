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

let server, ws, index

const createServer = (port, url) => {
    const server = http.createServer((req, res) => {
        res.writeHead(200)
        if (req.url === '/') {
            res.end(index.replace('</body>', `<script src="https://cdn.jsdelivr.net/npm/socket.io-client@2/dist/socket.io.js"></script>
            <script type="text/javascript">
window.onload = () => {
    const ws = io('http://localhost:${port}')
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
    server.listen(port, () => {
        console.log(chalk.green(`The web page is running on http://localhost:${port}`))
    })
    ws = io(server, {
        allowEIO3: true,
    })
    execSync(`start http://localhost:${port}`)
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
        ws.emit && ws.emit('news')
    }
})

process.on('beforeExit', (status) => {
    server && server.close()
    server = null
    process.exit(1)
})