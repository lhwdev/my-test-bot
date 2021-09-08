import chalk from 'chalk'
import { Message, MessageEmbed } from 'discord.js'
import { AudioPlayerStatus, createAudioPlayer, createAudioResource, joinVoiceChannel, NoSubscriberBehavior, StreamType, VoiceConnection } from '@discordjs/voice'
import ytdl from 'ytdl-core-discord'
import GuildData from './guild-data'
import log from '../../log'
import { getVideoInfo, linkFor } from './youtube'
import CommandParameter, { BotCommandError } from '../../command-parameter'


let idNumCache = 0


export async function discordPlayYoutube(data: GuildData, p: CommandParameter, id: string) {
  const idNum = idNumCache++
  const voiceChannel = p.member?.voice?.channel
  if (!voiceChannel)
    throw new BotCommandError('exec', '명령어 작성자가 음성 채널에 속해있지 않아서 음악을 재생할 수 없어요.')

  const link = linkFor(id)
  const audio = ytdl(link, { filter: 'audioonly', highWaterMark: 1 << 4 }) // promise

  if (data.playing) {
    data.playing.player.stop()
  }

  let connection: VoiceConnection
  if (data.playing && data.playing.channel.id == voiceChannel.id) {
    connection = data.playing.connection
  } else {
    if (data.playing) data.playing.connection.disconnect()
    
    connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator
    })
    connection.on('error', e => log(e))
  }

  data.playing = undefined
  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Pause
    },
  })
  const audioResource = createAudioResource(await audio, { inlineVolume: true, inputType: StreamType.Opus })
  player.play(audioResource)
  const subscription = connection.subscribe(player)!

  player.once(AudioPlayerStatus.Paused, () => {
    if(data.playing && data.playing.id != idNum) stopPlaying(data)
  })
  player.on('error', e => log(e))

  // show info
  const info = await getVideoInfo(id)
  const title = info.title
  const thumbnailUrl = info.thumbnails.default.url

  player.on('debug', text => log(chalk.grey(`from ${title}: ${text}`)))

  data.playing = {
    player,
    audioResource,
    connection,
    subscription,
    channel: voiceChannel,
    songName: title,
    songThumbnailUrl: thumbnailUrl,
    id: idNum,
    stop() {
      this.player.stop()
      this.subscription.unsubscribe()
      this.connection.disconnect()
    }
  }

  const embed = new MessageEmbed()
    .setColor('#ff5500')
    .setTitle(title)
    .setThumbnail(thumbnailUrl)
    .setURL(link)
    .setDescription('🎵 재생중')

  p.reply({ embeds: [embed] })
}


export function stopPlaying(data: GuildData) {
  const playing = data.playing
  data.playing = undefined
  if(playing) playing.stop()
  return !!playing
}