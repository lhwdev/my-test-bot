import { command } from '../command'
import dedent from 'dedent'
import { spawn } from 'child_process'
import { BotCommandError } from '../command-parameter'
import stringArgv from 'string-argv'
import { delay } from '../utils'
import config from '../config'
import { inspect } from 'util'
import { interceptors } from '../command-handler'
import log from '../log'


const terminalEmoji = '<:terminal:880833718737055864>'
const timeout = 500


delete interceptors['remote-command']


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
    // p.wip() // TODO: wip
    // throw new BotCommandError('exec', '🚧 수정중이니 좀만 기달')
    if(!p.isAdmin) throw new BotCommandError('exec', '이 명령어를 실행할 권한이 없습니다.\nDocker 컨테이너를 통한 실행은.. 기다려 주세요. ㄱㄷㄱㄷ')

    if(!p.content) {
      throw new BotCommandError('exec', '실행할 프로그램 이름을 입력해주세요.')
    }
    const [command, ...args] = stringArgv(p.content)
    const c = spawn(command, args, { windowsHide: true })
    let content = []
    let task = null

    const flush = async () => {
      let buffer = ''
      const limit = config().maxLimit
      for(const item of content) {
        if(buffer.length + item.length + 1 - 8 > limit) {
          await p.reply('```\n' + buffer.slice(0, -1) + '\n```')
          buffer = ''
          content = []
        }

        buffer += item
        buffer += '\n'
      }
      await p.replySafe('```\n' + buffer.slice(0, -1) + '\n```')
      buffer = ''
      content = []
      task = null
    }

    c.stdout.on('data', chunk => {
      log(String(chunk))
      const list = String(chunk).split(/\n|\r|\r\n/g)
      content = [...content, ...list]
      if(task == null) task = (async () => {
        await delay(timeout)
        await flush()
      })()
    })
    c.stdout.on('error', err => {
      p.replySafe(inspect(err))
    })
  
    c.on('error', (err) => {
      p.replySafe(inspect(err))
    })

    c.on('close', (code) => {
      const okay = code === null || code === 0
      p.reply(`${okay ? '✅' : '❌'} \`${code}\` 코드로 프로세스가 끝났습니다.`)
      delete interceptors['remote-command']
    })

    //   if(current == null) {
    //     current = task()
    //   } else {
    //     content += chunk
    //     current.then(() => current = task())
    //   }
    // })

    await p.reply(`${terminalEmoji} 프로세스를 시작했습니다.`)
    interceptors['remote-command'] = message => {
      if(message.content.startsWith('$')) {
        const input = message.content.slice(1).trim()
        if(input[0] === '.') {
          // dot command
          const raw = input.slice(1)
          const spaceAt = raw.indexOf(' ')
          const command = spaceAt == -1 ? raw : raw.slice(0, spaceAt)
          const content = spaceAt == -1 ? null : raw.slice(spaceAt + 1)
          switch(command) {
            case 'kill': {
              const result = c.kill()
              if(!result) p.reply('❌ 프로세스를 정지하지 못했습니다.')
              break
            }
            // case 'raw': {

            // }
            case 'ctrlc': {
              c.stdin.write('\u0043')
              break
            }
            case 'sudo': {
              c.stdin.write(`echo 12345678 | sudo -S ${content}`)
            }
          }
          return
        }
        c.stdin.write(input + '\n', error => {
          if(error) p.replySafe(`not sent: ${inspect(error)}`)
        })
      }
      return false
    }
  }
})
