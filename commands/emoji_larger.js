import dedent from 'dedent'
import { command } from '../command'
import twemoji from 'twemoji'
import ee from 'emoji-essential'
import { BotCommandError } from '../command-parameter'

const name2emoji = {}
Object.keys(ee).forEach(group => {
  Object.keys(ee[group]).forEach(sub => {
    Object.keys(ee[group][sub]).forEach(emoji => {
      const key = `${ee[group][sub][emoji].replace(/[ :]+/g, '_')}`
      name2emoji[key] = emoji
    })
  })
})

export default command({
  items: {
    commandHere: {
      name: 'emoji_larger',
      description: '이 명령어는 예시 명령어입니다!',
      help: dedent`
        예시 명령어 도움말입니다.
      `
    }
  },
  async handle(p) {
    // https://cdn.discordapp.com/emojis/${emoji.id}.png / .gif
    // https://cdn.discordapp.com/emojis/907638465242497024.png ?
    const emojiId = p.content.match(/<:.+?:(\d+)>/)
    if(emojiId == undefined) {
      const animEmojiId = p.content.match(/<a:.+?:(\d+)>/)
      if(animEmojiId == undefined) {
        if(p.content.match(/:.+:/)) {
          const url = twemoji.parse(name2emoji[p.content.slice(1, -1)])
          if(url) {
            await p.reply(url.match(/src="([a-zA-Z0-9/%:.]+)"/)[1])
          } else {
            throw new BotCommandError('exec', '존재하지 않는 이모티콘 이름입니다.')
          }
        } else {
          const url = twemoji.parse(p.content)
          if(url) {
            await p.reply(url.match(/src="([a-zA-Z0-9/%:.]+)"/)[1])
          } else {
            throw new BotCommandError('exec', '존재하지 않는 유니코드 이모지입니다.')
          }
        }
      } else {
        await p.reply(`https://cdn.discordapp.com/emojis/${emojiId[1]}.gif`)
    }
    } else {
      await p.reply(`https://cdn.discordapp.com/emojis/${emojiId[1]}.png`)
    }
    await p.deleteOriginal()

    
    
    // await p.reply({ embeds: [{ 
    //   title: '확대된 이모지!', 
    //   image: { url: `https://cdn.discordapp.com/emojis/${emojiId}.png` },
    //   author: { icon_url: p.author.avatarURL, name: p.author.username }
    // }] })
  }
})
