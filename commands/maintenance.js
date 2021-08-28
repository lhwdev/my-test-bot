import { command } from '../command'


export default command({
  items: {
    stop: {
      name: '봇 정지',
      description: '봇을 정지합니다.'
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
    p.ensureAdmin()
    switch(p.name) {
      case 'stop': {
        process.exit()
      }

    }
  }
})
