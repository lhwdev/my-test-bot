import dedent from 'dedent'
import { command } from '../command'


export default command({
  items: {
    ban: {
      name: '예시 명령어',
      description: '저 마구니를 때려죽입니다.',
      help: dedent`
        예시 명령어 도움말입니다.
      `
    }
  },
  async handle(p) {
    p.ensureAdmin()

    const l = await p.channel.messages.fetch({limit:100, before:'901837228253270026'})
    const r = l.filter(m => m.author.username.includes('Power386')).map(m => m.author).values()
    for(const u of r) {
    try {
      await p.guild.bans.remove(u)
    } catch(e) {
      // no-op
    }
    await p.guild.bans.create(u, {days: 7});console.log(u.username + '#' + u.discriminator)}
    p.reply('Done!')
  }
})
