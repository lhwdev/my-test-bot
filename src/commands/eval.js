import { command } from '../command'
import dedent from 'dedent'
import { inspect } from 'util'
import { VM } from 'vm2'
import { BotCommandError } from '../command-parameter'
import config from '../config'


const vm = new VM()


function runEval(p, onRun) {
  try {
    return onRun()
  } catch(e) {
    throw new BotCommandError('exec', `\`${p.author.username}$ ${e}\``, e)
  }
}


async function printResult(p, result) {
  let str
  if(result instanceof Promise) str = await result
  if(typeof result === 'object') str = inspect(result)
  else str = String(result)
  const limit = config().maxLimit
  if(str.length > limit) str = str.slice(0, limit - 4) + '\n...'
  if(str != '') await p.reply(`\`${str}\``)
}


export default command({
  items: {
    eval: {
      name: 'eval',
      description: 'js 명령어를 실행합니다.',

      help: dedent`
        js 명령어를 실행합니다.

        - \`!eval [js 코드]\`: 격리된 환경에서 js 코드를 실행합니다.
          \`\`\`js
          process.exit(0)
          \`\`\`
          이런 코드를 \`!eval\`을 통해 실행하려 했다가는 \`ReferenceError: process is not defined\`와 같은 오류가 날거에요.

        - \`!evalp [js 코드]\`: 디스코드 봇과 같은 환경에서 js 코드를 실행합니다. 관리자 권한이 필요합니다.  
          서버 컴퓨터를 꺼버리거나 테러할 수도 있으니 아주 위험한 명령어입니다. 따라서 일부 봇 관리자에게만 권한이 부여됩니다.
          봇 개발자(lhwdev)에게 요청해도 권한을 줄 일은 드뭅니다.

          만약 가상 os의 파일 시스템에 접근할 일이 있으면 \`!remote\` 명령어를 사용하면 Docker 컨테이너 안에서 명령어를 실행할 수도 있습니다...고 하지만, 아직 안 만들었어요.
      `
    }
  },

  async handle(p) {
    switch(p.name) {
      case 'eval': {
        const result = runEval(p, () => vm.run(p.content))
        await printResult(p, result)
        
        break
      }
      case 'evalp': {
        p.ensureAdmin()
        // if(p.author.id !== '551597391741059083') {
        //   p.reply('하지만 주인장이 아니었다')
        //   return
        // }
        const result = runEval(p, () => eval(p.content))
        await printResult(p, result)

        break
      }
    }
  }
})
