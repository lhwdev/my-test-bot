import { command } from '../command'
import dedent from 'dedent'
import { delay } from '../utils'
import { inspect } from 'util'


export default command({
  items: {
    eval: {
      name: 'eval',
      description: 'js 명령어를 실행합니다.',

      help: dedent`
        js 명령어를 실행합니다.
        - \`!eval [js 코드]\`: 격리된 환경에서 js 코드를 실행합니다.
        - \`!evalp [js 코드]\`: 디스코드 봇과 같은 환경에서 js 코드를 실행합니다. 관리자 권한이 필요합니다.
      `
    }
  },

  // eslint-disable-next-line require-await
  async handle(p) {
    const result = eval(p.content)
    let str = String(result)
    if(str.toString().startsWith('[object')) str = inspect(result)
    if(str.length > 1000) str = str.slice(0, 996) + '\n...'
    if(str != '') p.reply(`\`${str}\``)
  }
})
