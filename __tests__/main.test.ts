// import {wait} from '../src/wait'
import {readReactionsCounts} from '../src/reactions'
// import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import { Octokit } from "@octokit/rest";

test('throws invalid number', async () => {
  const input = parseInt('foo', 10)
  const octokit = new Octokit()
  await expect(readReactionsCounts(octokit, "foo", "bar", input)).rejects.toThrow('commentId not a number')
})

test('readReactionsCounts can getComment on issue', async () => {
  // make sure to run with `INPUT_TOKEN=your-token npm test`
  const octokit = new Octokit({
    auth: process.env['INPUT_TOKEN'] as string,
    previews: ['squirrel-girl'],
  })
  // TODO: Setup a better test case with values that are not the same. Probably need to lock commment if possible.
  const result = readReactionsCounts(octokit, "myyk", "git-democracy", 677573350)
  await expect(result).resolves.toHaveProperty('+1', 1)
  await expect(result).resolves.toHaveProperty('-1', 1)
})

//TODO: E2E test needs some work to complete this successfully. Not sure what's wrong.
// test('test runs', () => {
//   // make sure to run with `INPUT_TOKEN=your-token npm test`
//   process.env['INPUT_REPOSITORY'] = 'myyk/git-democracy'
//   process.env['INPUT_COMMENT_ID'] = '677573350'
//   const ip = path.join(__dirname, '..', 'lib', 'main.js')
//   const options: cp.ExecSyncOptions = {
//     env: process.env
//   }
//   console.log(cp.execSync(`node ${ip}`, options).toString())
// })


// test('wait 500 ms', async () => {
//   const start = new Date()
//   await wait(500)
//   const end = new Date()
//   var delta = Math.abs(end.getTime() - start.getTime())
//   expect(delta).toBeGreaterThan(450)
// })
//
// // shows how the runner will run a javascript action with env / stdout protocol
// test('test runs', () => {
//   process.env['INPUT_MILLISECONDS'] = '500'
//   const ip = path.join(__dirname, '..', 'lib', 'main.js')
//   const options: cp.ExecSyncOptions = {
//     env: process.env
//   }
//   console.log(cp.execSync(`node ${ip}`, options).toString())
// })
