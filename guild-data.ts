import { Guild, StreamDispatcher, VoiceConnection } from "discord.js"


type Playing = {
  stream: StreamDispatcher,
  connection: VoiceConnection,
  songName: string,
  songThumbnailUrl: string,
  id: number
}


export default class GuildData {
  private _volume = 0.3
  get volume() {
    return this._volume
  }
  set volume(newVolume: number) {
    this._volume = newVolume
    if(this.playing) this.playing.stream.setVolume(newVolume)
  }

  playing?: Playing


  constructor(public guild: Guild) {}
}

