import { DMChannel, NewsChannel, TextChannel } from 'discord.js'
import { DirectCommandItem } from './command'


export function showHelpForItem(command: string, item: DirectCommandItem, channel: TextChannel | DMChannel | NewsChannel) {
    const newHelp = item.help.split('\n').map(s => `> ${s}`).join('\n')
    channel.send(`💬 명령어 도움말(\`${command}\`):\n${newHelp}`)
}
