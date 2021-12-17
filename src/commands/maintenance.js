import { command } from '../command'


export default command({
  items: {
    terminate: {
      name: '봇 정지',
      description: '_장비를 정지합니다._'
    },
    restart: {
      name: '봇 재시작',
      description: '봇을 재시작합니다.',
      help: '봇을 재시작합니다. 일반적으로 봇을 재시작할 필요는 없습니다. 대신 `reload`를 참고하세요.'
    },
    reload: {
      name: '봇 리로드',
      description: 'Node.js 프로세스를 재시작하지 않고 봇을 리로드합니다.'
    }
  },
  async handle(p) {
    switch(p.name) {
      case 'terminate': {
        if(p.isAdmin) {
          process.exit()
        } else {
          await p.reply('안돼! 장비를 정지할 수 없어!\nhttps://han.gl/ajAmO')
        }
        break
      }

      case 'restart': {
        p.ensureAdmin()
        // 흠....
        break
      }

      case 'reload': {
        p.ensureAdmin()
        for(const key of Object.keys(require.cache)) {
          if(key.startsWith(process.cwd)) {
            delete require.cache[key] // 이게 맞나...
          }
        }
        break
      }
    }
  }
})
