import { Collection } from 'discord.js'
import { command } from '../command'
import { delay } from '../utils'


export default command({
  items: {
    cleanup: {
      name: '셀프청소',
      description: '자기(lhwdev-bot)이 싸질러놓은 글들을 치웁니다.',
      help: '`!cleanup (개수)`: 자기가 쓴 글을 \'개수\'개만큼 지웁니다. 개수가 없을 경우 기본으로 100개를 지웁니다.'
    },
    '치워': { aliasTo: 'cleanup' }
  },

  async handle(p) {
    const botUser = p.bot.user
    let count
    if(p.content == '') count = 100
    else parseInt(p.content)
    if(count <= 0 || isNaN(count)) p.errorHelp('parameter', '잘못된 개수입니다.')
    if(count > 100) count = 100

    const progress = await p.reply('🔨 제가 쓴 글들을 삭제합니다.')

    const messagesMap = p.channel.messages.cache.filter(m => m.author == botUser && m.id != progress.id)
    const messagesList = Array.from(messagesMap.entries())

    const messages = new Collection(messagesList.slice(0, count))
    await p.channel.bulkDelete(messages)
    await p.delete()

    progress.edit('✅ 제가 쓴 글들을 삭제했습니다.')
    await delay(2000)
    await progress.delete()
  }
})
