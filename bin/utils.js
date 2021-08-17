const {
    statSync,
    readdirSync
} = require('fs')
const mime = require('mime/lite')
const { resolve } = require('path')

const files = []

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

exports.normalizeFile = (path, suffix) => {
    console.log(path)
    const temp = process.platform === 'win32' ? path.split('\\\\') : path.split('/')
    if (temp[temp.length - 1]) {
        const res = temp[temp.length - 1]
        const point = res.indexOf('.')
        if (point > 0 && point < res.length) {
            return res.includes(suffix) ? res : res.slice(0, point) + suffix
        }
    }
}

const normalizeLoc = (path) => {
    if (typeof path !== 'string') return ''
    return process.platform === 'win32' ? path.replace(/\//g, "\\").trim() : path.trim()
}

const findFile = (path = __dirname, type, target) => {
    const fileNames = readdirSync(path)
    for (let i = 0; i < fileNames.length; i++) {
        const file = resolve(path, fileNames[i])
        if (/((^|[\/\\])\..|node_modules|README|package-lock|yarn|LICENSE)/.test(file)) {
            continue
        }
        if (mime.getType(file) === type) {
            if (file.includes(target)) {
                files.length = 0
                return normalizeLoc(file)
            }
            files.push(file)
        }

        const isExist = statSync(file)
        if (isExist.isDirectory()) {
            files.push(findFile(file, type, target))
        }
    }

    const res = [...files]
    files.length = 0
    return normalizeLoc(res.find(file => file && file.includes(target)) || res[0])
}

exports.findFile = findFile
exports.normalizeLoc = normalizeLoc