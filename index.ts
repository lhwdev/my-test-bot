import { Client, Intents } from 'discord.js'
import log from './log'
import { applicationId, clientId, token } from './secrets.json'
import  chalk from 'chalk'
import { CommandHandler, interceptors } from './command-handler'
import { REST } from '@discordjs/rest'

import readline from 'readline'
import { Routes } from 'discord-api-types/v9'
import { SlashCommandBuilder, SlashCommandStringOption } from '@discordjs/builders'


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
  // Intents.FLAGS.GUILD_BANS,
  // Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
  // Intents.FLAGS.GUILD_INTEGRATIONS,
  // Intents.FLAGS.GUILD_WEBHOOKS,
  // Intents.FLAGS.GUILD_INVITES,
  Intents.FLAGS.GUILD_VOICE_STATES,
  // Intents.FLAGS.GUILD_PRESENCES,
  Intents.FLAGS.GUILD_MESSAGES,
  // Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  // Intents.FLAGS.GUILD_MESSAGE_TYPING,
  // Intents.FLAGS.DIRECT_MESSAGES,
  // Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
  // Intents.FLAGS.DIRECT_MESSAGE_TYPING,
] })
// const guildsData: Record<string, GuildData> = {}
// export const rest = new REST({ version: '9' }).setToken(token)

const handler = new CommandHandler(client)

// rest.put(
//   Routes.applicationGuildCommands(clientId, '868429217740783637'),
//   { body: [
//     new SlashCommandBuilder()
//           .setName('hello')
//           .setDescription('테스트 명령어!')
//           .addStringOption(
//             new SlashCommandStringOption()
//               .setName('parameter')
//               .setDescription('오우 테스트')
//           )
//           .toJSON()
//   ] }
// )

client.once('ready', async () => {
  log(chalk.greenBright('ready!'))
})

client.on('messageCreate', async message => {
  await handler.handleMessage(message)
})
client.on('interactionCreate', async interaction => {
  if(!interaction.isCommand()) return
  interaction.reply('와!')
})

client.login(token)
