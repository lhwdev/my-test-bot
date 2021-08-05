import { command } from '../command'
import dedent from 'dedent'


export default command({
  items: {
    help: {
      name: 'eval',
      description: 'js 명령어를 실행합니다.',

      help: dedent`
        js 명령어를 실행합니다.
        - \`!eval [js 코드]\`: 격리된 환경에서 js 코드를 실행합니다.
      `
    }
  },
  async handle(p) {

  }
})
