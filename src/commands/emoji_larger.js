
import dedent from 'dedent'
import { command } from '../command'
import twemoji from 'twemoji'
import ee from 'emoji-essential'
// eslint-disable-next-line no-unused-vars
import CommandParameter, { BotCommandError } from '../command-parameter'
import { interceptors } from '../command-handler'

const name2emoji = {}
Object.keys(ee).forEach(group => {
  Object.keys(ee[group]).forEach(sub => {
    Object.keys(ee[group][sub]).forEach(emoji => {
      const key = `${ee[group][sub][emoji].replace(/[ :]+/g, '_')}`
      name2emoji[key] = emoji
    })
  })
})


let sessionGuide = false

const emojiLargerCommand = command({
  items: {
    emoji_larger: {
      name: '이모티콘 확대',
      description: '이모티콘을 확대해줍니다!',
      /* eslint-disable no-irregular-whitespace */
      help: dedent`
        디스코드 cdn에서 이모티콘의 원래 url을 가져와서 사진으로 보여줍니다.

        예시들:
        - !emo ❤ (유티코드 이모티콘)
        - !emo :​heart: (디스코드 내장 이모티콘)
        - !emo <​:rage_LOL:819049836782682152> (디스코드 이모티콘)
          !emo [;rage_LOL;819049836782682152] (디스코드 이모티콘: 니트로 없는 사람도 해당 서버 밖에서 사용가능)
        - !emo <​a:he:861402669893681222> (디스코드 애니메이션 이모티콘)
          !emo [a;he;861402669893681222] (디스코드 애니메이션 이모티콘: 니트로 없는 사람도 사용가능)
      `
      /* eslint-enable no-irregular-whitespace */
    }
  },
  async handle(p) {
    switch(p.name) {
      case 'emoji':
        await this.handleEmoji(p)
        break

      case 'emoji_botnitro':
        await this.handleEmojiBotNitro(p)
        break

      case 'emoji_larger':
        await this.handleEmojiLarger(p)
        break

      case 'emoji_id':
        await this.handleEmojiId(p)
        break

      default:
        throw new BotCommandError('no-command', '???')
    }
  },
  
  /**
   * @param {CommandParameter} p
   */
  async handleEmoji(p) {
    let c = p.content.trim()
    c = c.replaceAll(/(<|\[)[:;].+?[:;](\d+)(>|\])/g, 'https://cdn.discordapp.com/emojis/$2.png ')
      .replaceAll(/(<|\[)a[:;].+?[:;](\d+)(>|\])/g, 'https://cdn.discordapp.com/emojis/$2.gif ')
      // .replaceAll(/[:;](.+)[:;]/g, (_str, name) => twemoji.parse(name2emoji[name]).match(/src="([a-zA-Z0-9/%:.]+)"/)[2])

    p.replySafe(c)
    await p.deleteOriginal()
  },
  /**
   * @param {CommandParameter} p
   */
  async handleEmojiBotNitro(p) {
    let c = p.content.trim()
    c = c.replaceAll(/(<|\[)[:;](.+)[:;](\d+)(>|\])/g, '<:$2:$3>')
      .replaceAll(/(<|\[)a[:;](.+)[:;](\d+)(>|\])/g, '<a:$2:$3>')
      // .replaceAll(/[:;](.+)[:;]/g, (_str, name) => twemoji.parse(name2emoji[name]).match(/src="([a-zA-Z0-9/%:.]+)"/)[2])

    p.replySafe(c)
    await p.deleteOriginal()
  },
  /**
   * @param {CommandParameter} p
   */
  async handleEmojiLarger(p) {
    const c = p.content.trim()
    const emojiId = c.match(/(<|\[)[:;].+?[:;](\d+)(>|\])/)

    async function message(all, url) {
      // await p.reply({ content: `<@!${p.author.id}>: \`${all.replaceAll('<', '[').replaceAll('>', ']').replaceAll(':', ';')}\``, allowedMentions: { parse: [] } })
      await p.reply(url)
    }

    if(emojiId) {
      await message(emojiId[0], `https://cdn.discordapp.com/emojis/${emojiId[2]}.png`)
    } else {
      const animEmojiId = c.match(/(<|\[)a[:;].+?[:;](\d+)(>|\])/)
      if(animEmojiId) {
        await message(animEmojiId[0], `https://cdn.discordapp.com/emojis/${animEmojiId[2]}.gif`)
      } else {
        if(c.match(/[:;].+[:;]/)) {
          const url = twemoji.parse(name2emoji[c.slice(1, -1)])
          if(url) {
            await message(c, url.match(/src="([a-zA-Z0-9/%:.]+)"/)[2])
          } else {
            throw new BotCommandError('exec', '존재하지 않는 이모티콘 이름입니다.')
          }
        } else {
          if(c.length != 1) throw new BotCommandError('exec', '존재하지 않는 유니코드 이모지입니다.')
          const url = twemoji.parse(c)
          if(url) {
            await message(c, url.match(/src="([a-zA-Z0-9/%:.]+)"/)[2])
          } else {
            throw new BotCommandError('exec', '존재하지 않는 유니코드 이모지입니다.')
          }
        }
      }
    }
    await p.deleteOriginal()

    
    
    // await p.reply({ embeds: [{ 
    //   title: '확대된 이모지!', 
    //   image: { url: `https://cdn.discordapp.com/emojis/${emojiId}.png` },
    //   author: { icon_url: p.author.avatarURL, name: p.author.username }
    // }] })
  },
  /**
   * @param {CommandParameter} p
   */
  async handleEmojiId(p) {
    await p.replySafe(
      '사용한 이모티콘의 아이디: ' + (p.content.replaceAll('<', '[').replaceAll('>', ']').replaceAll(':', ';')) +
      (sessionGuide ? '' : '\n> 참고로 실제 이모티콘 id는 []를 <>, ;를 :로 바꾼 것입니다.')
    )
    sessionGuide = true
  }
})


// // mock up the command handler behavior
// interceptors['emoji_larger'] = (handler, message) => {
//   const parameter = new CommandParameter(
//     handler, emojiLargerCommand, message,
//     '', 'emoji_larger', message.content, message.content
//   )

//   try {
//     emojiLargerCommand.handle(parameter)
//     return true
//   } catch (e) {
//     console.log('not my emoji')
//     // was not emoji
//     return false
//   }
// }


export default emojiLargerCommand
