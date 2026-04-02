import { createClient } from '../client.js'
import { outputJson, outputCsv, makeTable, fmtUsd, fmtTs } from '../output.js'
import chalk from 'chalk'

export function registerNews(program) {
  program
    .command('news')
    .description('Crypto news and flash alerts (新闻快讯) — VIP2')
    .option('-t, --type <n>', 'Type: 1=flash alerts, 2=news articles', '1')
    .option('-l, --lang <lang>', 'Language: zh or en', 'zh')
    .option('-n, --size <n>', 'Number of items per page', '10')
    .option('-p, --page <n>', 'Page number', '1')
    .option('--popular', 'Show popular only')
    .option('--search <query>', 'Search query', '')
    .option('--json', 'Output raw JSON')
    .action(async (opts) => {
      const client = createClient()
      const data = await client.get('/api/news/getNewsList', {
        params: {
          type: opts.type,
          lang: opts.lang,
          page: opts.page,
          pageSize: opts.size,
          isPopular: opts.popular ? 'true' : 'false',
          search: opts.search || '',
        },
      })
      if (opts.json) return outputJson(data)
      const rows = Array.isArray(data) ? data : data?.list || []

      const label = opts.type === '2' ? 'News Articles' : 'Flash Alerts'
      console.log(chalk.bold(`\n  ${label} (${opts.lang})\n`))
      for (const r of rows) {
        const time = r.publishTime ? chalk.grey(fmtTs(r.publishTime)) : ''
        console.log(chalk.bold('  • ' + (r.title || r.content || '').slice(0, 80)))
        if (time) console.log('    ' + time)
        if (r.content && r.title) console.log('    ' + chalk.grey(r.content.slice(0, 120) + (r.content.length > 120 ? '…' : '')))
        console.log()
      }
    })
}
