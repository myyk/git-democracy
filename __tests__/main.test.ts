import * as cp from 'child_process'
import * as path from 'path'

test('test runs', () => {
  // make sure to run with `INPUT_TOKEN=your-token npm test`
  process.env['INPUT_REPOSITORY'] = 'myyk/git-democracy'
  process.env['INPUT_COMMENTID'] = '677573350'
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  const options: cp.ExecSyncOptions = {
    env: process.env
  }
  console.log(cp.execSync(`node ${ip}`, options).toString())
})
