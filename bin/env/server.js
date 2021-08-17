/**
 * env: server
 */

const { execSync } = require('child_process')
const chalk = require('chalk')
const { findFile } = require('../utils')

let index

const startScript = () => {
    if (index) {
        execSync(`npx pm2 start ${index}`)
        console.log(chalk.greenBright(`server entry ${index} is started by pm2`))
    }
}

module.exports = {
    message: ({ message, url }) => {
        if (message === 'init') {
            index = findFile(undefined, 'application/javascript', url)
            startScript()
        } else if (message === 'update') {
            console.log(chalk.yellowBright(`file ${url} changed, and the server will restart`))
            execSync(`npx pm2 restart ${index}`)
        }
    },
    exit: () => {
        execSync('npx pm2 del all')
    }
}