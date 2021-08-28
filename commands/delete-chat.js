import { command } from '../command'
import { delay } from '../utils'


export default command({
  items: {
    delete: {
      name: '삭제',
      description: '명령어 를! 뭉탱이로 삭제합니다.'
    }
  },
  async handle(p) {
    let count = parseInt(p.content)
    if(isNaN(count)) count = 5
    
    const loops = Math.floor(count / 100)
    const extra = count % 100
    

    for(let i = 0; i < loops; i++) {
      await p.channel.bulkDelete(100)
    }
    await p.channel.bulkDelete(extra)

    const message = await p.reply('✅ 뭉탱이로 삭제 완료')
    await delay(1000)
    message.delete()
  }
})
