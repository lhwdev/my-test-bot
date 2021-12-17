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
    const prefix = '<@!' + p.author.id + '>: '
    p.deleteOriginal()
    switch(p.name) {
      case 'k2e': {
        await p.reply({ content: prefix + inko.ko2en(p.content), allowedMentions: { parse: [] } })
        break
      }
      case 'e2k': {
        await p.reply({ content: prefix + inko.en2ko(p.content), allowedMentions: { parse: [] } })
        break
      }
      default: {
        await p.reply('???')
        break
      }
    }
  }
})
