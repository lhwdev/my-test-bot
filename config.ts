import watch from 'node-watch'
import path from 'path'

const sConfigJson = './config/bot-config.json'
let conf = require(sConfigJson)

watch(sConfigJson, {}, () => {
  delete require.cache[path.resolve(sConfigJson)]
  try {
    conf = require(sConfigJson)
  } catch(e) {
    console.error(`Malformed json: ${e}`)
  }
})



export default function config() {
  return conf
}

