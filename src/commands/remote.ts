import { command } from '../command'
import dedent from 'dedent'
import { spawn, IPtyForkOptions } from 'node-pty'
import { BotCommandError } from '../command-parameter'
import stringArgv from 'string-argv'
import Anser from 'anser'
import { delay } from '../utils'
import config from '../config'
import { inspect } from 'util'
import { interceptors } from '../command-handler'
import log from '../log'
import os from 'os'
import { open } from 'fs/promises'
import { resolve } from 'path'


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
    
    if(p.author.id !== '551597391741059083') {
      p.reply('하지만 주인장이 아니었다')
      return
    }

    if(!p.content) {
      throw new BotCommandError('exec', '실행할 프로그램 이름을 입력해주세요.')
    }
    const argv = stringArgv(p.content)
    const flags: IPtyForkOptions = {}
    const file = await open(resolve('./debug.txt'), 'w')
    let fileIndex = 0

    let columns = 200
    let rows = 60
    let scrollLength = 1000

    for(const arg in argv) {
      if(arg.startsWith('-')) {
        const [name, value] = arg.split('=')
        
        switch(name) {
          case '--name':
          case '-n': {
            flags.name = value
            break
          }
          case '--cwd':
          case '-d': {
            flags.cwd = value
            break
          }
          default: throw new BotCommandError('exec', '알 수 없는 인수입니다. \`!help !remote\`를 입력해서 자세한 정보를 확인하세요.')
        } 
      } else {
        break
      }

      fileIndex++
    }

    const command = argv[fileIndex] // 않이 매번 `C:\Program Files\Powershell\pwsh.exe`를 칠 수는 없는데
    const args = argv.slice(fileIndex + 1)
    log(`프로세스 시작 ${command} / ${inspect(args)} / ${inspect(flags)}`)
    const process = spawn(command, args, flags)

    let content: string[] = []
    let task: Promise<void> | null = null
    let silent = false

    const flush = async () => {
      let buffer = ''
      const limit = config().maxLimit
      for(const item of content) {
        if(buffer.length + item.length + 1 - 8 > limit) {
          await file.write(buffer)
          await p.replySafe('```\n' + buffer.slice(0, -1) + '\n```')
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

    const parse = (m: string) => {
      const text = Anser.ansiToText(m)
      const list = text.split(/\n|\r|\r\n/g)
      content = [...content, ...list]
      if(task == null) task = (async () => {
        await delay(timeout)
        await flush()
      })()
    }

    process.onData(str => {
      parse(str)
    })

    process.onExit(async e => {
      await p.replySafe(`${terminalEmoji} 프로세스가 ${e.exitCode}로 끝났습니다.${e.signal !== undefined ? '' : ' ' + e.signal}`)
      await file.close()
      delete interceptors['remote-command']
    })

    interceptors['remote-command'] = (_handler, message) => {
      const c = message.content
      if(!c.startsWith('$')) return false
      const content = c.slice(1)
      if(content.startsWith('.')) {
        const spaceIndex = content.indexOf(' ')
        const command = spaceIndex == -1 ? content : content.slice(0, spaceIndex)
        const body = spaceIndex == -1 ? null : content.slice(spaceIndex + 1)

        switch(command) {
          case 'noln': {
            process.write(body!)
            break
          }
          case 'kill': {
            process.kill()
            break
          }
        }
        return true
      }

      log('wow log ' + content)
      process.write(content + '\n')
      return true
    }
  }
})
