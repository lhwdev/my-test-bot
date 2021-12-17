import dedent from 'dedent'
import { command } from '../command'


export default command({
  items: {
    tool: {
      name: '예시 명령어',
      description: '이 명령어는 예시 명령어입니다!',
      help: dedent`
        예시 명령어 도움말입니다.
      `
    }
  },
  async handle(p) {
    // await p.reply('(지금은 임무를 다한 듯 하다. 아니면 하고 있나?)')
    p.ensureAdmin()

    await p.reply('모든 멤버에게 \'사람\' 역할을 부여합니다.')

    const members = await p.guild.members.list({ limit: 1000 })
    const target = await p.guild.roles.fetch('914166481955221505')
    for(const member of members.values()) {
      await member.roles.add(target)
    }

    await p.reply('✅ 완료했습니다.')

    return
    
    const users = await p.guild.members.list({ limit: 1000 })
    const whitelist = ['623058639116042250']
    const queryDate = new Date()
    const latest = Array.from(users.filter(u => {
      const interval = queryDate.getTime() - u.joinedTimestamp
      return interval < 1000 * 60 * 1000 * 10 && !whitelist.includes(u.id)
    }).values())
    await p.reply(latest.map(u => u.user.username).join(', ') + '를 벤합니다.')

    for(const u of latest) {
      await u.ban({ days: 7, reason: '봇 사용자 자동 추방'})
      console.log('banned ' + u.user.username)
    }

    await p.reply(`${latest.length}명을 성공적으로 밴했습니다.`)
  }
})
