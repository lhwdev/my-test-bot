import dedent from 'dedent'
import { readFile } from 'fs/promises'
import { command } from '../command'
import { BotCommandError } from '../command-parameter'


const probability = 0.05
const roleId = '881167312919592960'
const cooltime = 5000

const cooltimes = new Set()
let cooltimesMap = {}


export default command({
  items: {
    권한가챠: {
      name: '권한 가챠',
      description: '극악의 확률로 권한을 얻을 수 있습니다.',
      indexed: false,
      help: dedent`
        극악의 확률로 권한을 얻을 수 있습니다.
        모 게임회사처럼 확률조작 의혹이 터지지 않게 하기 위해(?) 확률을 공개합니다.
        확률은 \`${probability}\` (0~1) 입니다. 덤으로 소스코드 공개를 원하시는 분은 \`!권한가챠 소스\`를 쳐주세요.
      `
    }
  },
  async handle(p) {
    if(p.content === '소스') {
      await p.reply('```js\n' + (await readFile(__filename, 'utf-8')).replace(/```/g,'\\`\\`\\`') + '\n```')
      return
    }
    if(p.content == '-c') {
      p.ensureAdmin()
      cooltimes.clear()
      await p.reply('✅ 쿨타임을 리셋했습니다.')
      cooltimesMap = {}
      return 
    }

    p.wip()
    const authorId = p.author.id
    if(cooltimes.has(p.author.id)) {
      const ticks = Date.now() - cooltimesMap[p.author.id]
      throw new BotCommandError('exec', `쿨타임이 아직 끝나지 않았습니다. (${Math.round((cooltime - ticks) / 1000)}초 남음)`)
    }

    // eslint-disable-next-line no-empty
    for(let i = 0; i < Math.random() * 5; i++) {}

    const value = Math.random()
    const isSuccess = value < probability
    if(isSuccess) {
      const roles = p.member.roles
      if(roles.cache.has(roleId)) {
        await p.reply('어라? 왜 권한이 있는 분이 가챠를 해서 뽑히는거지')
        return
      }

      await p.reply(`🎉 ${p.author.username}님이 권한가챠에 당첨되었습니다!\n주의할 점: '권한가챠' 역할은 언제든지 삭제될 수 있습니다.`)
      await roles.add(roleId)
    } else {
      cooltimes.add(authorId)
      cooltimesMap[authorId] = Date.now()
      await p.reply(`⛔ 권한가챠에 실패하셨습니다... 슬프네요. \`${Math.round(value * 1000) / 1000}(렌덤값) > ${probability}\``)
      setTimeout(() => {
        cooltimes.delete(authorId)
        delete cooltimesMap[authorId]
      }, cooltime)
    }
  }
})
