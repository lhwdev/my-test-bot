import dedent from 'dedent'
import { command } from '../command'

export default command({
  items: {
    ban: {
      name: '예시 명령어',
      description: '저 마구니를 때려죽입니다.',
      help: dedent`
        예시 명령어 도움말입니다.
      `,
    },
  },
  async handle(p) {
    p.ensureAdmin()
    if(p.author.id != '551597391741059083') {
      await p.reply('그리고 넌 어드민이 아니지')
      return
    }

    // p.reply('아직 안만들었어요..')
    // return

    switch(p.name) {
      case 'ban': {
        const ind = p.content.indexOf(' ')
        const userStr = p.content.slice(0, ind)
        const reasonDay = p.content.slice(ind + 1)
        const reasInd = reasonDay.indexOf(' ')
        const days = reasonDay.slice(0, reasInd)
        const reason = reasonDay.slice(reasInd + 1)

        const user = userStr.match(/<@!?(\d+)>/)[1]
        // p.guild.roles.fetch()
        // await p.guild.bans.create(user, { reason, days: parseInt(days) })
        await p.reply(`${userStr}을 '${reason}'의 이유로 밴했습니다.`)
        return
      }
      case 'unban': {
        const user = p.content.match(/<@!?(\d+)>/)[1]
        await p.guild.bans.remove(user)
        await p.reply(`${p.content} 봐줬다....`)
        return
      }
    }

    const l = await p.channel.messages.fetch({
      limit: 100,
      before: '901837228253270026',
    })
    const r = l.filter((m) => m.author.username.includes('Power386')).map((m) =>
      m.author
    ).values()
    for (const u of r) {
      try {
        await p.guild.bans.remove(u)
      } catch (e) {
        // no-op
      }
      await p.guild.bans.create(u, { days: 7 })
      console.log(u.username + '#' + u.discriminator)
    }
    p.reply('Done!')
  },
})
