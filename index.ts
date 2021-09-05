import { Client, Intents } from 'discord.js'
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


const client = new Client({ intents: [
  Intents.FLAGS.GUILDS,
  // Intents.FLAGS.GUILD_MEMBERS,
  Intents.FLAGS.GUILD_BANS,
  Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
  // Intents.FLAGS.GUILD_INTEGRATIONS,
  // Intents.FLAGS.GUILD_WEBHOOKS,
  Intents.FLAGS.GUILD_INVITES,
  Intents.FLAGS.GUILD_VOICE_STATES,
  // Intents.FLAGS.GUILD_PRESENCES,
  Intents.FLAGS.GUILD_MESSAGES,
  Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  Intents.FLAGS.GUILD_MESSAGE_TYPING,
  // Intents.FLAGS.DIRECT_MESSAGES,
  // Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
  // Intents.FLAGS.DIRECT_MESSAGE_TYPING,
] })
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
