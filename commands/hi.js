import { command } from '../command'


export default command({
  items: {
    hi: {
      name: '안녕?',
      description: '안녕?을 듣고 싶으면 이 명령어를 쓰세요.'
    },
    hi2: { aliasTo: 'hi' }
  },
  async handle(p) {
    await p.reply('ㅎㅇㅎㅇ')
  }
})
