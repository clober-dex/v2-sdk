export * from './types'
export * from './views'
export * from './calls'
export * from './utils'

export const getVersion = () => {
  const fs = require('fs')
  const path = require('path')
  const packageJsonPath = path.join(__dirname, '../package.json')
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).version as string
}
