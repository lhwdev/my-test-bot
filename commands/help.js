import { command } from '../command'
import dedent from 'dedent'
import { resolveItemAlias } from '../command-parameter'
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

      for (const [prefix, name, command] of commands) {
        if(command.aliasTo) continue
        const aliases = commands.filter(c => c[2].aliasTo === name).map(c => c[1]).join(', ')
        result += `> **${prefix}${name}**${aliases == ''? '' : ' (' + aliases + ')'}: ${command.description}\n`
      }

      p.reply(`💬 모든 명령어 목록:\n${result}`)
      return
    }

    const spec = await p.handler.commandSpec(p.content)
    showHelpForItem(spec.prefix + spec.name, resolveItemAlias(spec.command.items, p.content), p.channel)
  }
})
