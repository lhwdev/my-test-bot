import { command } from '../command'
import dedent from 'dedent'
import { BotCommandError, resolveItemAlias } from '../command-parameter'
import { showHelpForItem } from '../command-utils'


export default command({
  items: {
    help: {
      name: '도움말',
      description: '어떤 명령어의 도움말을 표시합니다.',

      help: dedent`
        도움말을 표시합니다.
        - \`!help [명령어 이름]\`: 명령어의 도움말 표시하기
        - \`!help -l\`: 모든 명령어 목록 표시하기
      `
    }
  },
  async handle(p) {
    if(p.content == '') {
      p.showHelp()
      return
    }

    if(p.content == '-l') {
      const commands = await p.handler.listAllCommands()
      let result = ''

      for(const info of commands) {
        const item = info.loaded.command.items[info.meta.name]
        if(!item) {
          // just alias
          continue
        }
        if(item.indexed === false) continue
        const aliases = commands.filter(c => c.meta.aliasTo === info.meta.name).map(c => c.meta.name).join(', ')
        result += `> **${info.meta.prefix}${info.meta.name}**${aliases == ''? '' : ' (' + aliases + ')'}: ${item ? item.description : '(도움말 없음)'}\n`
      }

      p.reply(`💬 모든 명령어 목록:\n${result}`)
      return
    }

    const spec = await p.handler.commandSpec(p.content)
    if(spec == null) throw new BotCommandError(
      'exec',
      dedent`
        알 수 없는 명령어입니다. \`!help -l\`을 입력해서 확인해보세요.
        **참고: \`!help\` 뒤에는 ! 같은 접두사가 붙은 명령어를 써야 합니다.** (예시: \`!help !help\`)
      `
    )
    if(!spec) {
      throw new BotCommandError('exec', '알 수 없는 명령어입니다. `!help -l`을 입력해서 확인해보세요.')
    }
    await showHelpForItem(spec.prefix + spec.name, resolveItemAlias(spec.command.items, spec.name), p.channel)
  }
})
