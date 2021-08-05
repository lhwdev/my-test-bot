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
  // const guild = message.guild
  // if(!guild) return
  // let data = guildsData[guild.id]
  // if(!data) {
  //   data = new GuildData(guild)
  //   guildsData[guild.id] = data
  // }

  await handler.handleMessage(message)

  /* const reply = message.channel.send.bind(message.channel)

  try {
    // check if the message is from the bot self
    // if (message.member?.id == client.user?.id) {
    //   return
    // }

    const content = checkCommand(message)
    if (!content) return

    channel = message.channel

    if (content.startsWith('play from youtube id ')) {
      discordPlayYoutube(data, message, content.slice(20))
    } else if (content.startsWith('play ')) {
      const id = await searchVideo(content.slice(5))
      if (id == null) {
        reply('⚠ 해당 이름의 영상을 찾지 못했어요. 다시 시도해 보세요.')
        return
      }
      discordPlayYoutube(data, message, id)
    } else if (content.startsWith('skip ')) {
      const secs = content.slice(5)
      // data.playing
    } else if (content.startsWith('volume ')) {
      const str = content.slice(7)
      const number = parseInt(str) / 100.0
      if (number >= 1.0 || number <= 0.0 || isNaN(number)) {
        if(str == 'up') {
          data.volume = Math.min(data.volume + 0.05, 1)
          reply(`음량을 높였어요. (${data.volume * 100})`)
        }
        else if(str == 'down') {
          data.volume = Math.max(data.volume - 0.05, 0)
          reply(`음량을 낮췄어요. (${data.volume * 100})`)
        }
        else reply('⚠ 음량은 0에서 100 사이의 숫자에요.')
        return
      }
      data.volume = number
      reply('음량을 조절했어요.')
    } else if (content.startsWith('e2k ')) {
      deleteOriginal()
      const inko = new Inko()
      reply(inko.en2ko(content.slice(4)))
    } else if (content.startsWith('k2e ')) {
      deleteOriginal()
      const inko = new Inko()
      reply(inko.ko2en(content.slice(4)))
    } else if (content.startsWith('delete ')) {
      const num = parseInt(content.slice(7))
      const repeat = Math.floor(num / 100)
      for(let i = 0; i < repeat; i ++) {
        (message.channel as TextChannel).bulkDelete(100)
      }

      (message.channel as TextChannel).bulkDelete(num - 100 * repeat)
    } else if (content.startsWith('embed ')) {
      const c = JSON.parse(content.slice(6))
      deleteOriginal()
      const embed = new MessageEmbed()
        .setColor(c.color)
        .setTitle(c.title)
        .setURL(c.link)
        .setDescription(c.description)

    reply(embed)
    } else if(content.startsWith('config ')) {

    } else switch (content) {
      case 'hi': {
        reply('오 ㅎㅇㅎㅇ')
        break
      }
      case 'now': {
        if(data.playing)
          reply(`🎵 재생중: ${data.playing.songName}, 음량: ${data.volume}`)
        else reply('재생중인 노래가 없어요.')
        break
      }
      case 'stop': {
        if(stopPlaying(data)) reply('노래를 멈췄어요.')
        else reply('⚠ 재생중인 노래가 없어요.')
        break
      }

      default: {
        reply('⚠ 명령을 이해하지 못했어요.')
        break
      }
    }
  } catch(e) {
    reply(`와 뻐그다 ${e}`)
  } */
})

client.login(token)
