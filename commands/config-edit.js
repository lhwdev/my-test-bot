import { command } from '../command'
import { BotCommandError } from '../command-parameter'
import config from '../config'
import fs from 'fs/promises'
import { inspect } from 'util'


export default command({
  items: {
    config: {
      name: '설정 수정',
      description: '설정을 수정합니다.'
    }
  },
  async handle(p) {
    p.ensureAdmin()

    if(p.content.length === 0) {
      await p.reply('✅ 설정 데이터: \n```' + inspect(config()) + '\n```')
      return
    }

    const si = p.content.indexOf(' ')

    if(si === -1) {
      await p.reply(`✅ ${p.content}의 설정값: \`` + inspect(config()[p.content]) + '`')
      return
    }

    const key = p.content.slice(0, si)
    const value = p.content.slice(si + 1)
    const c = config()
    c[key] = JSON.parse(value)
    await fs.writeFile('./config/bot-config.json', JSON.stringify(c, null, 2))
    await p.reply(`✅ ${key} 설정이 ${value}로 변경되었습니다.`)
  }
})
