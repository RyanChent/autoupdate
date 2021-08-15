#! /usr/bin/env node

const program = require('commander')
const {
    init,
    watch
} = require('./watch')
const ora = require('ora')
const chalk = require('chalk')
const {
    fork,
    execSync
} = require('child_process')
const {
    resolve
} = require('path')
const {
    getPort,
    getMode,
    getCommand
} = require('./utils')

let childProcess = null

const current = process.cwd()

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
    .option('-c, --command <command...>', 'once file changed may exec, commands should be aggregated into one sentence')
    .option('-p, --port <port>', 'hot reload program port')
    .action(async (dir, {
        mode = 'server',
        command = [],
        port = 12345
    }) => {
        const spinner = ora('Starting...')
        const validPath = /^(?:[^\/]+\/?)+[^\/]$/
        try {
            if (validPath.test(dir)) {
                const env = getMode(mode),
                    p = getPort(port),
                    cmd = getCommand(command),
                    dirPath = resolve(current, dir)
                const watcher = await init(dirPath)
                childProcess = fork(`./bin/env/${env}`)
                childProcess.send({
                    port: p,
                    message: 'init'
                })
                await watch(watcher, childProcess, dirPath, env, cmd)
                spinner.succeed('Start successful')
                console.log(chalk.green(`the server is started on port ${p}`))
            } else {
                throw new Error('the path is invalid, please check it')
            }
        } catch (e) {
            spinner.fail('Start Failed')
            console.log(chalk.red(e.message || e))
            process.exit(-1)
        }
    })

program.parse(process.argv)