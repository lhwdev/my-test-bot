import chalk from 'chalk'
import { Message, MessageEmbed, StageChannel, VoiceChannel } from 'discord.js'
import { AudioPlayerStatus, createAudioPlayer, createAudioResource, joinVoiceChannel, NoSubscriberBehavior, StreamType, VoiceConnection } from '@discordjs/voice'
import ytdl from 'ytdl-core-discord'
import GuildData, { SongInfo } from './guild-data'
import log from '../../log'
import { getVideoInfo, linkFor, searchVideo } from './youtube'
import CommandParameter, { BotCommandError } from '../../command-parameter'


let idNumCache = 0
const queueLimit = 3


export async function nowPlaying(data: GuildData, p: CommandParameter) {
  const isAll = p.content == 'all'
  const song = data.playing?.song

  const embed = new MessageEmbed()
    .setColor('#ff5500')
    .setTitle(song ? song.name : "재생중인 노래 없음")
  if(song) {
    embed.setThumbnail(song.thumbnailUrl)
    embed.setDescription('🎵 재생중')
    embed.setURL(song.link)
  }

  const queue = data.queue
  if(queue.length > 0) {
    const isSliced = !isAll && queue.length > queueLimit
    const q = isAll ? queue : queue.slice(0, queueLimit)

    for(let i = 0; i < q.length; i++) {
      const item = q[i]
      embed.addField(
        i == 0 ? '다음 곡' : `#${i + 1}`,
        item.name,
        false
      )
    }

    if(isSliced) {
      embed.addField('대기열', `총 ${q.length}곡 남음`, true)
    }
  }

  p.reply({
    embeds: [embed]
  })
}

export async function playYoutube(data: GuildData, p: CommandParameter) {
  if(p.content == '') {
    if(data.queue.length > 0) {
      await playNextQueue(data, p)
    } else {
      await nowPlaying(data, p)
    }
    return
  }
  const id = await searchVideo(p.content)
  if (!id) throw new BotCommandError('exec', '노래를 찾을 수 없어요.')

  const voiceChannel = p.member?.voice?.channel
  if (!voiceChannel)
    throw new BotCommandError('exec', '명령어 작성자가 음성 채널에 속해있지 않아서 음악을 재생할 수 없어요.')

  const link = linkFor(id)
  const info = await getVideoInfo(id)
  const title = info.title
  const thumbnailUrl = info.thumbnails.default.url

  const songInfo: SongInfo = {
    name: title,
    thumbnailUrl: thumbnailUrl,
    link: link
  }

  if(data.playing) {
    console.log('already playing; queued!')
    data.queue.push(songInfo)

    const embed = new MessageEmbed()
      .setColor('#ff5500')
      .setTitle(songInfo.name)
      .setThumbnail(songInfo.thumbnailUrl)
      .setDescription('🎵 대기열에 추가됨')
      .addField('현재 재생중', data.playing.song.name, false)
    
    await p.reply({ embeds: [embed] })
  } else {
    console.log('no playing entry')
    await playYoutubeImpl(songInfo, voiceChannel, data)

    await nowPlaying(data, p)
  }
}

export async function playNextQueue(data: GuildData, p: CommandParameter | null) {
  const queue = data.queue
  const target = queue.shift()
  if(!target) {
    await p?.reply('⚠ 현재 대기열에 아무 노래도 들어있지 않아요.')
    return
  }

  const channel = data.playing?.channel ?? p?.member?.voice?.channel
  if(!channel) {
    await p?.reply('⚠ 명령어 작성자가 음성 채널에 속해있지 않아요.')
    return
  }

  await stopPlaying(data, false)
  await playYoutubeImpl(target, channel, data)
}

async function playYoutubeImpl(songInfo: SongInfo, voiceChannel: VoiceChannel | StageChannel, data: GuildData) {
  const idNum = idNumCache++

  const audio = ytdl(songInfo.link, { filter: 'audioonly', highWaterMark: 1 << 12 }) // promise

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

  // player.once(AudioPlayerStatus.Paused, async () => {
  //   if(data.playing && data.playing.id != idNum) await stopPlaying(data, false)
  // })
  player.on('error', e => log(e))
  player.on(AudioPlayerStatus.Idle, async () => {
    await playNextQueue(data, null)
  })


  player.on('debug', text => log(chalk.grey(`from ${songInfo.name}: ${text}`)))

  data.playing = {
    player,
    audioResource,
    connection,
    subscription,
    channel: voiceChannel,
    song: {
      name: songInfo.name,
      thumbnailUrl: songInfo.thumbnailUrl,
      link: songInfo.link
    },
    id: idNum,
    stop() {
      this.player.stop()
      this.subscription.unsubscribe()
      this.connection.disconnect()
      data.playing = undefined
    }
  }
}


export async function stopPlaying(data: GuildData, all: boolean) {
  const playing = data.playing
  if (playing) playing.stop()

  data.playing = undefined

  if(data.queue.length > 0) {
    if(all) {
      data.queue = []
    }
  }
  
  return !!playing
}
