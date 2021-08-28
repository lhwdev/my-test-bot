import dedent from 'dedent'
import { command } from '../command'


export default command({
  items: {
    progress: {
      name: '예시 명령어',
      description: '이 명령어는 예시 명령어입니다!',
      help: dedent`
        예시 명령어 도움말입니다.
      `
    }
  },
  async handle(p) {
    const message = await p.reply('로딩 중')
  }
})
