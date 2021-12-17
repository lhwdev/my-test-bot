import dedent from 'dedent'
import { command } from '../command'
import { persist } from '../command-handler'
import GuildData from './youtube/guild-data'
import { nowPlaying, playNextQueue, playYoutube, stopPlaying } from './youtube/youtube-discord'


/** @type {Record<string, GuildData>} */
const datas = persist('datas', () => ({}))


export default command({
  name: 'youtube',
  items: {
    play: {
      name: '유튜브 재생',
      description: '유튜브에서 곡을 검색해서 재생합니다.',
      help: dedent`
        유튜브에서 곡을 검색해서 재생합니다.
        명령어:
        - \`!play [곡 이름]\`
        - \`!play [유튜브 주소]\`
      `
    }
  }, // TODO

  async handle(p) {
    let data = datas[p.guild.id]
    if(!(p.guild.id in datas)) {
      data = new GuildData(p.guild)
      datas[p.guild.id] = data
    }
        
    switch(p.name) {
      case 'now': {
        await nowPlaying(data, p)
        break
      }

      case 'play': {
        await playYoutube(data, p)
        break
      }

      case 'next': {
        await playNextQueue(data, p)
        break
      }

      case 'stop': {
        await stopPlaying(data, true)
        break
      }

      
    }
  }

})
