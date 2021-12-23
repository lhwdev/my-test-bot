import { command } from '../command'
import { BotCommandError } from '../command-parameter'
import { delay } from '../utils'


const logFile = '../config/delete/backup.txt'


export default command({
  items: {
    delete: {
      name: '삭제',
      description: '명령어 를! 뭉탱이로 삭제합니다.'
    }
  },
  async handle(p) {
    p.ensureAdmin()

    let count = p.content ? parseInt(p.content) : 5
    if(isNaN(count)) throw new BotCommandError('exec', '잘못된 개수입니다.')
    
    const loops = Math.floor(count / 100)
    const extra = count % 100
    
    await delay(500)

    for(let i = 0; i < loops; i++) {
      
      await p.channel.bulkDelete(100)
    }
    if(extra > 0) await p.channel.bulkDelete(extra)

    const message = await p.reply(`✅ 메시지 ${count}개를 뭉탱이로 삭제 완료`)
    await delay(3000)
    await message.delete()
  }
})
