import { Client } from 'discord.js'
import log from './log'
import { token } from './secrets.json'
import  chalk from 'chalk'
import { CommandHandler } from './command-handler'

import readline from 'readline'


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

let channel: any = null

function ask() {
  rl.question('bot> ', (message) => {
    if(channel == null) return
    channel.send(message)
    ask()
  })
}


const client = new Client()
// const guildsData: Record<string, GuildData> = {}
const handler = new CommandHandler(client)

client.once('ready', () => {
  log(chalk.greenBright('ready!'))
  ask()
})

client.on('message', async message => {
  await handler.handleMessage(message)
})

client.login(token)
