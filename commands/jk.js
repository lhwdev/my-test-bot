import dedent from 'dedent'
import { command } from '../command'


export default command({
  items: {
    commandHere: {
      name: '예시 명령어',
      description: '이 명령어는 예시 명령어입니다!',
      help: dedent`
        예시 명령어 도움말입니다.
      `
    }
  },
  async handle(p) {

    await p.reply(`${p.content} 너 벤`)
  }
})
