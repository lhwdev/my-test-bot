import dedent from 'dedent'
import { command } from '../command'
import { BotCommandError } from '../command-parameter'
import GuildData from './youtube/guild-data'
import { searchVideo } from './youtube/youtube'
import { discordPlayYoutube } from './youtube/youtube-discord'


const datas = {}


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
        - ~~\`!play [유튜브 주소]\`~~: 아직 지원 안됨
      `
    }
  }, // TODO

  async handle(p) {
    const data = datas[p.guild.id]
    switch(p.name) {
      case 'play': {
        if(!(p.guild.id in datas)) {
          datas[p.guild.id] = new GuildData(p.guild)
        }
        const data = datas[p.guild.id]
        const play = await searchVideo(p.content)
        if(!play) throw new BotCommandError('exec', '노래를 찾을 수 없어요.')
        await discordPlayYoutube(data, p, play)
        break
      }

      case 'stop': {
        data.playing.stop()
        break
      }

      
    }
  }

})
