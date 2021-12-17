// https://api.urbandictionary.com/v0/define
import dedent from 'dedent'
import { command } from '../command'
import fetch from 'node-fetch'
import { inspect } from 'util'


export default command({
  items: {
    meaning: {
      name: '예시 명령어',
      description: '이 명령어는 예시 명령어입니다!',
      help: dedent`
        예시 명령어 도움말입니다.
      `
    }
  },
  async handle(p) {
    const result = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(p.content)}`)
    const result2 = await result.json()
    p.replySafe(inspect(result2.list[0].definition))
  }
})
