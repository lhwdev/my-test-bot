import { Channel, Client, MessageEmbed, TextChannel } from 'discord.js'
import log from './log'
import { token } from './secrets.json'
import { checkCommand } from './command-checker'
import { searchVideo } from './youtube'
import { discordPlayYoutube, stopPlaying } from './youtube-discord'
import GuildData from './guild-data'
import  chalk from 'chalk'
import { CommandHandler } from './command-handler'

import readline from 'readline'
import Inko from 'inko'


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
