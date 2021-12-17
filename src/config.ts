import { readFileSync } from 'fs'
import watch from 'node-watch'
import path, { resolve } from 'path'
import { Document, parse, parseDocument } from 'yaml'

const sConfigYaml = './config/bot-config.yaml'
let document: Document.Parsed
let conf

function reload() {
  // document = parseDocument(readFileSync(sConfigYaml, 'utf-8'))
  conf = parse(readFileSync(resolve(sConfigYaml), 'utf-8'))
}

reload()

let hotReload = true

watch(sConfigYaml, {}, () => {
  try {
    if(hotReload) reload()
  } catch(e) {
    console.error(`Malformed json: ${e}`)
  }
})



export default function config() {
  return conf
}


export function editConfig(mergeTarget) {

}
