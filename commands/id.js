import { command } from '../command'
import dedent from 'dedent'


export default command({
  items: {
    id: {
      name: '아이디',
      description: '어떤 사람의 아이디를 표시합니다.',

      help: dedent`
        어떤 사람의 아이디를 표시합니다.
      `
    }
  },
  async handle(p) {
    await p.reply(p.message.author.id)
  }
})
