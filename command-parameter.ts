import { Message, User, TextChannel, DMChannel, NewsChannel, Guild, Client, GuildMember } from 'discord.js'
import { Command, CommandItem, DirectCommandItem } from './command'
import { CommandHandler, CommandSpec } from './command-handler'
import { showHelpForItem } from './command-utils'
import config from './config'


type BotCommandErrorType = 'no-command' | 'parameter' | 'exec' | 'command-spec'
type BotCommandErrorParams = {
  showHelp?: boolean,
  noHead?: boolean
}

export class BotCommandError {
  constructor(public type: BotCommandErrorType, public message: string, public params?: BotCommandErrorParams) {}

  toString() {
    return `BotCommandError(${this.type}): ${this.message}${this.params !== undefined? '\n' + this.params : ''}`
  }
}


type CommandReplyAsk = {
  ask: Message,
  command: CommandSpec | null,
  reply: CommandReply[]
}

type CommandReplyMessage = {
  message: Message
}

type CommandReply = CommandReplyAsk | CommandReplyMessage

type CommandInvocation = {
  command: CommandSpec,
  reply: CommandReply[]
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

  get client(): Client {
    return this.message.client
  }

  get author(): User {
    return this.message.author
  }

  get member(): GuildMember | null {
    return this.guild?.member(this.author) ?? null
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

  get isAdmin(): boolean {
    return config().botAdminUsers.includes(this.author.id)
  }

  ensureAdmin() {
    if(!this.isAdmin) throw new BotCommandError('exec', '봇 관리자 권한이 없습니다.')
  }

  wip(): void {
    throw new BotCommandError('exec', '🚧 아직 완성되지 않은 명령어입니다.', { noHead: true })
  }

  async reply(content: any): Promise<Message> {
    return await this.channel.send(content)
  }

  santinize(content: string): string {
    if(content.length >= 2000) return content.slice(0, 1997) + '...'
    if(content.length == 0) {
      console.log(`santinize failed for ${content}: length == 0`)
      throw new BotCommandError('exec', 'santinize failed')
    }
    else return content
  }

  async replySafe(content: string): Promise<Message | null> {
    try {
      return await this.reply(this.santinize(content))
    } catch(e) {
      return null
    }
  }

  async replyToThis(content: any): Promise<Message> {
    return await this.message.reply(content)
  }


  async deleteOriginal() {
    if(config().deleteOriginal && !this.deletedOriginal) {
      await this.message.delete()
      this.deletedOriginal = true
    }
  }

  async delete() {
    await this.message.delete()
    this.deletedOriginal = true
  }

  async replace(content: any) {
    await this.delete()
    await this.reply(content)
  }

  error(type: BotCommandErrorType, message: string) {
    throw new BotCommandError(type, message)
  }

  errorHelp(type: BotCommandErrorType, message: string) {
    throw new BotCommandError(type, message, { showHelp: true })
  }

  showHelp() {
    showHelpForItem(this.prefix + this.name, resolveItemAlias(this.command.items, this.name), this.channel)
  }
}


export function resolveItemAlias(items: Record<string, CommandItem>, name: string): DirectCommandItem {
  const item = items[name]
  if('aliasTo' in item) return resolveItemAlias(items, item.aliasTo)
  else return item
}

