import dedent from 'dedent'
import { command } from '../command'
import GuildData from '../guild-data'
import { searchVideo } from '../youtube'
import { discordPlayYoutube } from '../youtube-discord'


const datas = []


export default command({
  name: 'youtube',
  items: {
    play: {
      name: '유튜브 재생',
      description: '유튜브에서 곡을 검색해서 재생합니다.',
      help: dedent`
        
      `
    }
  }, // TODO

  async handle(p) {
    switch(p.name) {
      case 'play': {
        if(!(p.guild.id in datas)) {
          datas[p.guild.id] = new GuildData(p.guild)
        }
        const data = datas[p.guild.id]
        const play = await searchVideo(p.content)
        await discordPlayYoutube(data, p.message, play)
        break
      }

      case 'stop': {
        datas[p.guild.id]
      }
    }
  }

})
