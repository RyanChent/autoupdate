const chokidar = require('chokidar')
const {
    statSync,
    readdirSync
} = require('fs')
const {
    resolve
} = require('path')
const mime = require('mime/lite')

const htmls = []

const findHtml = (path, type = 'text/html', name = 'index.html') => {
    const fileNames = readdirSync(path)
    for (const name of fileNames) {
        const file = resolve(path, name)
        if (mime.getType(file) === type) {
            htmls.push(file)
        }
        const isExist = statSync(file)
        if (isExist.isDirectory()) {
            findHtml(file, type)
        }
    }

    return htmls.find(html => html && html.includes(name)) || htmls[0]
}

exports.init = (filePath) => {
    return new Promise((resolve, reject) => {
        const isExist = statSync(filePath)
        if (isExist.isDirectory()) {
            const watcher = chokidar.watch(filePath, {
                persistent: true,
                ignored: /((^|[\/\\])\..|node_modules|README|package-lock|yarn|LICENSE)/,
                cwd: filePath
            })
            watcher.on('error', (err) => {
                reject(err)
            })
            return resolve(watcher)
        } else {
            reject('目录不存在，请重试')
        }
    }).catch(e => {
        throw new Error(e.message || e)
    })
}

exports.watch = async (watcher, childProcess, dir, mode, cmd) => {
    const handler = (filename) => {
        const filepath = resolve(dir, filename)
        if (childProcess) {
            if (mode === 'client') {
                childProcess.send({
                    message: 'update',
                    url: filepath
                })
            } else if (mode === 'server') {
                console.log(mime.getType(filepath))
            }
        }
    }
    if (watcher) {
        watcher.on('change', handler).on('unlink', handler).on('unlinkDir', handler)
        if (mode === 'client') {
            const html = findHtml(dir)
            html && childProcess.send({
                message: 'update',
                url: html
            })
        }
    }
}