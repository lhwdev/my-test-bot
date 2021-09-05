import dedent from 'dedent'
import { command } from '../command'


export default command({
  items: {
    ban: {
      name: '예시 명령어',
      description: '저 마구니를 때려죽입니다.',
      help: dedent`
        예시 명령어 도움말입니다.
      `
    }
  },
  async handle(p) {
    await p.reply('Hello, world!')
  }
})
