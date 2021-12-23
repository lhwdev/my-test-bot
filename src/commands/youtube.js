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
        유튜브에서 곡을 검색해서 재생합니다. 이미 재생중인 곡이 있다면 대기열의 끝에 추가합니다.
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
        if(p.content != '') {
          if(p.content.startsWith('-')) {
            const index = parseInt(p.content.slice(1))
            if(!isNaN(index) && index <= data.queue.length && index > 0) {
              const removed = data.queue.splice(index - 1, 1)[0]
              await p.reply(`대기열에서 ${index}번째 곡을 제거했습니다.\n🎵 ${removed.name}`)
            } else {
              await p.reply('⚠ 잘못된 위치입니다.')
            }
          }
        } else {
          await nowPlaying(data, p)
        }
        break
      }

      case 'play': {
        if(p.content == '' || p.content == 'all') {
          await nowPlaying(data, p)
        } else {
          await playYoutube(data, p)
        }
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

      case 'replace': {
        await stopPlaying(data, true)
        await playYoutube(data, p)
      }
    }
  }

})
