import { command } from '../command'
import Inko from 'inko'


const inko = new Inko()


export default command({
  items: {
    k2e: {
      name: '안녕?',
      description: '안녕?을 듣고 싶으면 이 명령어를 쓰세요.'
    }
  },
  async handle(p) {
    switch(p.name) {
      case 'k2e':
      case '' {
        await p.reply(inko.ko2en(p.content))
        break
      }
      default: {
        await p.reply('???')
        break
      }
    }
  }
})
