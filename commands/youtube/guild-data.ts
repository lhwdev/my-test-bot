import { Channel, Guild } from 'discord.js'
import { AudioPlayer, AudioResource, PlayerSubscription, VoiceConnection } from '@discordjs/voice'


type Playing = {
  player: AudioPlayer,
  audioResource: AudioResource,
  connection: VoiceConnection,
  subscription: PlayerSubscription,
  channel: Channel,
  songName: string,
  songThumbnailUrl: string,
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


  constructor(public guild: Guild) {}
}

