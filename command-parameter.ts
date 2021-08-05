import { Message, User, TextChannel, DMChannel, NewsChannel, Guild, Client } from 'discord.js'
import { Command, CommandItem, DirectCommandItem } from './command'
import { CommandHandler } from './command-handler'
import config from './config'


type BotCommandErrorType = 'no-command' | 'parameter' | 'exec'

export class BotCommandError {
  constructor(public type: BotCommandErrorType, public message: string, public params?: any) {}
}



export default class CommandParameter {
  public deletedOriginal = false


  constructor(
    public handler: CommandHandler,
    public command: Command,
    public message: Message,
    public prefix: string,
    public name: string,
    public content: string,
    public allContent: string
  ) {}

  get author(): User {
    return this.message.author
  }

  get channel(): TextChannel | DMChannel | NewsChannel {
    return this.message.channel
  }

  get guild(): Guild | null {
    return this.message.guild
  }

  get bot(): Client {
    return this.message.client
  }


  async reply(content: any): Promise<Message> {
    return await this.channel.send(content)
  }


  async deleteOriginal() {
    if(config().deleteOriginal) {
      await this.message.delete()
      this.deletedOriginal = true
    }
  }

  error(type: BotCommandErrorType, message: string) {
    throw new BotCommandError(type, message)
  }

  errorHelp(type: BotCommandErrorType, message: string) {
    throw new BotCommandError(type, message, { showHelp: true })
  }

  showHelp() {
    const item = resolveItemAlias(this.command.items, this.name)
    const newHelp = item.help.split('\n').map(s => `> ${s}`).join('\n')
    this.reply(`💬 명령어 도움말(\`${this.prefix}${this.name}\`):\n${newHelp}`)
  }
}


export function resolveItemAlias(items: Record<string, CommandItem>, name: string): DirectCommandItem {
  const item = items[name]
  if('aliasTo' in item) return resolveItemAlias(items, item.aliasTo)
  else return item
}

