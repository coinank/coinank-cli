import { getApiKey, setApiKey, deleteApiKey, getConfigPath } from '../config.js'

export function registerConfig(program) {
  const cmd = program.command('config').description('Manage CLI configuration')

  cmd
    .command('set <key> <value>')
    .description('Set a config value (e.g. set apikey YOUR_KEY)')
    .action((key, value) => {
      if (key === 'apikey') {
        setApiKey(value)
        console.log('API key saved.')
      } else {
        console.error(`Unknown config key: ${key}`)
        process.exit(1)
      }
    })

  cmd
    .command('get [key]')
    .description('Get a config value')
    .action((key) => {
      if (!key || key === 'apikey') {
        const k = getApiKey()
        console.log(k ? `apikey: ${k.slice(0, 6)}${'*'.repeat(k.length - 6)}` : 'apikey: (not set)')
      }
    })

  cmd
    .command('delete <key>')
    .description('Delete a config value')
    .action((key) => {
      if (key === 'apikey') {
        deleteApiKey()
        console.log('API key deleted.')
      }
    })

  cmd
    .command('path')
    .description('Show config file path')
    .action(() => {
      console.log(getConfigPath())
    })
}
