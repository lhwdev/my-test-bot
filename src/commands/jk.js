import dedent from 'dedent'
import { command } from '../command'
import { interceptors } from '../command-handler'


export default command({
  items: {
    commandHere: {
      name: '예시 명령어',
      description: '이 명령어는 예시 명령어입니다!',
      help: dedent`
        예시 명령어 도움말입니다.
      `
    }
  },
  async handle(p) {

    await p.reply(`${p.content} 너 벤`)
  }
})


// interceptors['폭풍저그 콩진호'] = (handler, message) => {
//   if(message.author.bot) return
//   message.channel.send('(콩진호 모드) ' + message.content)
//   return false
// }
