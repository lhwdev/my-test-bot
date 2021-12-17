import { Channel, Guild, StageChannel, VoiceChannel } from 'discord.js'
import { AudioPlayer, AudioResource, PlayerSubscription, VoiceConnection } from '@discordjs/voice'


export type SongInfo = {
  name: string,
  thumbnailUrl: string,
  link: string
}

export type Playing = {
  player: AudioPlayer,
  audioResource: AudioResource,
  connection: VoiceConnection,
  subscription: PlayerSubscription,
  channel: VoiceChannel | StageChannel,
  song: SongInfo,
  id: number,
  stop: () => void
}


export default class GuildData {
  private _volume = 0.3
  get volume() {
    return this._volume
  }
  set volume(newVolume: number) {
    this._volume = newVolume
    if(this.playing) this.playing.audioResource.volume!!.setVolume(newVolume)
  }

  playing?: Playing

  queue: SongInfo[] = []


  constructor(public guild: Guild) {}
}

