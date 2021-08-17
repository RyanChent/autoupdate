const chokidar = require('chokidar')
const {
    statSync
} = require('fs')
const {
    resolve
} = require('path')
const { findFile } = require('./utils')

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

exports.watch = async (watcher, childProcess, dir, mode, serverEntry) => {
    const handler = (filename) => {
        const filepath = resolve(dir, filename)
        if (childProcess) {
            childProcess.message({
                message: 'update',
                url: filepath
            })
        }
    }
    if (watcher) {
        watcher.on('change', handler).on('unlink', handler).on('unlinkDir', handler)
        if (mode === 'client') {
            const html = findFile(undefined, 'text/html', 'index.html')
            html && childProcess.message({
                message: 'update',
                url: html
            })
        }
    }
}