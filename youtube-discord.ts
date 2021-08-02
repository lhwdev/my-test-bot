import chalk from 'chalk'
import { Message, MessageEmbed, VoiceConnection } from 'discord.js'
import ytdl from 'ytdl-core-discord'
import GuildData from './guild-data'
import log from './log'
import { getVideoInfo, linkFor } from './youtube'


let idNumCache = 0


export async function discordPlayYoutube(data: GuildData, message: Message, id: string) {
  const reply = message.channel.send.bind(message.channel)

  const idNum = idNumCache++
  const voiceChannel = message.member?.voice?.channel
  if (!voiceChannel) {
    reply('⚠ 명령어 작성자가 음성채널에 속해있지 않아서 음악을 재생할 수 없습니다.')
    return
  }
  const link = linkFor(id)
  const audio = ytdl(link, { filter: 'audioonly', highWaterMark: 1 << 24 }) // promise

  if (data.playing) {
    data.playing.stream.destroy()
  }

  let connection: VoiceConnection
  if (data.playing && data.playing.connection.channel.id == voiceChannel.id) {
    connection = data.playing.connection
  } else {
    if (data.playing) data.playing.connection.disconnect()
    connection = await voiceChannel.join()
    connection.on('error', e => log(e))
  }

  data.playing = undefined
  const stream = connection.play(await audio, { type: 'opus', volume: data.volume, highWaterMark: 1 })
  stream.once('finish', () => { if(data.playing && data.playing.id != idNum) stopPlaying(data) })
  stream.on('error', e => log(e))

  // show info
  const info = await getVideoInfo(id)
  const title = info.title
  const thumbnailUrl = info.thumbnails.default.url

  stream.on('debug', text => log(chalk.grey(`from ${title}: ${text}`)))

  data.playing = {
    stream,
    connection,
    songName: title,
    songThumbnailUrl: thumbnailUrl,
    id: idNum
  }

  const embed = new MessageEmbed()
    .setColor('#ff5500')
    .setTitle(title)
    .setThumbnail(thumbnailUrl)
    .setURL(link)
    .setDescription('🎵 재생중')

  reply(embed)
}


export function stopPlaying(data: GuildData) {
  const playing = data.playing
  data.playing = undefined
  if(playing) {
      playing.stream.destroy()
      playing.connection.disconnect()
  }
  return !!playing
}
