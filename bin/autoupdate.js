#! /usr/bin/env node

const program = require('commander')
const {
    init,
    watch
} = require('./watch')
const ora = require('ora')
const chalk = require('chalk')
const {
    fork
} = require('child_process')
const {
    resolve
} = require('path')
const {
    getPort,
    getMode
} = require('./utils')
const { normalizeFile } = require('./utils')

let childProcess = null

const exit = () => {
    childProcess && childProcess.kill('SIGINT')
    process.exit(1)
}

process.on('SIGINT', exit)
process.on('uncaughtException', exit)
process.on('unhandledRejection', exit)

program
    .version('1.0.0', '-v, --version')
    .command('watch <dir>')
    .option('-m, --mode <mode>', 'only server or client can be accepted, default is server')
    .option('-p, --port <port>', 'hot reload program port')
    .option('-f, --file <file>', 'server entry file to start')
    .action(async (dir, {
        mode = 'server',
        port = 12345,
        file
    }) => {
        const spinner = ora('Starting...')
        const validPath = /^(?:[^\/]+\/?)+[^\/]$/
        try {
            if (validPath.test(dir)) {
                /** init var */
                const env = getMode(mode),
                    p = getPort(port),
                    dirPath = resolve(process.cwd(), dir)

                /** init watcher */
                const watcher = await init(dirPath)

                /** test server entry */
                if (file && !validPath.test(file)) {
                    throw new Error('the server entry path is invalid, please check it')
                }

                /** fork child process */
                childProcess = fork(`./bin/env/${env}`)
                childProcess.send({
                    port: p,
                    message: 'init',
                    url: env === 'client' ? dirPath : file
                })

                /** add watch event */
                await watch(watcher, childProcess, dirPath, env, normalizeFile(file, '.js'))

                /** start success */
                spinner.succeed('Start successful')
                console.log(chalk.greenBright(`the server is started on port ${p}`))

            } else {
                throw new Error('the path is invalid, please check it')
            }
        } catch (e) {
            spinner.fail('Start Failed')
            console.log(chalk.redBright(e.message || e))
            process.exit(-1)
        }
    })

program.parse(process.argv)