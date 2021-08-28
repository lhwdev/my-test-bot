import { command } from '../command'
import dedent from 'dedent'
import { spawn } from 'child_process'
import { BotCommandError } from '../command-parameter'
import stringArgv from 'string-argv'
import { delay } from '../utils'


const terminalEmoji = '<:terminal:880832626670325823>'

function santinize(s) {
  return s.length > 1000 ? s.slice(0, 997) + '...' : s
}


export default command({
  items: {
    remote: {
      name: '원격 제어',
      description: '원격으로 봇 서버 컴퓨터를 제어할 수 있습니다.',

      help: dedent`
        원격으로 봇 서버 컴퓨터를 제어할 수 있습니다.
        _(TODO)_
      `
    }
  },
  async handle(p) {
    // throw new BotCommandError('exec', '🚧 수정중이니 좀만 기달')
    if(!p.isAdmin) throw new BotCommandError('exec', '이 명령어를 실행할 권한이 없습니다.\nDocker 컨테이너를 통한 실행은.. 기다려 주세요. ㄱㄷㄱㄷ')

    const [command, ...args] = stringArgv(p.content)
    const c = spawn(command, args, { windowsHide: true })

    let current = null
    let content = null

    c.stdout.on('data', (chunk) => {
      const str = santinize(String(chunk)).trim()
      const task = async () => {
        if(str) {
          await p.reply(str)
          delay(300)
        }
        current = null
      }
      
      if(current == null) {
        current = task()
      } else {
        content += chunk
        current.then(() => current = task())
      }
    })

    await p.reply(`${terminalEmoji} 프로세스를 시작했습니다.`)
  }
})
