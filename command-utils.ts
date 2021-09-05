import { TextBasedChannels } from 'discord.js'
import { DirectCommandItem } from './command'


export async function showHelpForItem(command: string, item: DirectCommandItem, channel: TextBasedChannels) {
    const helpStr = item.help ?? item.description ?? '(도움말 없음)'
    const newHelp = helpStr.split('\n').map(s => `> ${s}`).join('\n')
    await channel.send(`💬 (명령어 도움말) \`${command}\`:\n${newHelp}`)
}
