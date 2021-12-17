import dedent from 'dedent'
import { command } from '../command'


export default command({
  items: {
    notice: {
      name: '자가진단 매크로 앱 공식 디코방 전용 명령어',
      description: '#정식-릴리즈 채널의 공지를 쓰는 기능이브니다',
      help: dedent`
        예시 명령어 도움말입니다.
      `
    }
  },
  async handle(p) {
    const sp = p.content.indexOf(' ')
    const command = p.content.slice(0, sp)
    const content = p.content.slice(sp + 1)

    const notCh = p.guild.channels.fetch('871386327994728460')
    const logCh = p.guild.channels.fetch('872655924274278400')

    switch(command) {
      case 'publish': {
        const [id] = content.split(' ')
        
        break
      }
    }
  }
})
