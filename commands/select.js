import { command } from '../command'
import { delay } from '../utils'


export default command({
  items: {
    select: {
      name: '선택기',
      description: '결정장애를 가지신 분들을 위한 선택기. 콤마로 구분합니다.'
    }
  },
  async handle(p) {
    let list = p.content.split(',')
    p.reply(list[Math.floor(Math.random() * list.length)])
    await delay(500) // 일단 500ms로
  }
})
