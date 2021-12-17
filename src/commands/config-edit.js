import { command } from '../command'
import config from '../config'
import fs from 'fs/promises'
import { inspect } from 'util'
import JSON5 from 'json5'


/**
 * @param {any} obj
 * @param {string} path
 * @returns { { get: () => any, set: (any) => void } }
 */
function location(obj, path) {
  const paths = path.split('/')
  let current = obj

  for(const item of paths.slice(0, -1)) {
    current = current[item]
  }

  const last = paths[paths.length - 1]

  return {
    get: () => current[last],
    set(value) { current[last] = value }
  }
}

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
    const target = location(c, key)
    target.set(JSON5.parse(value))
    
    await fs.writeFile('./config/bot-config.json', JSON5.stringify(c, null, 2))
    await p.reply(`✅ ${key} 설정이 ${value}로 변경되었습니다.`)
  }
})
