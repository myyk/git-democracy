import * as core from '@actions/core'
import * as github from '@actions/github'
import {GitHub} from '@actions/github/lib/utils'
import {run} from '../src/main'

// Inputs for mock @actions/core
let inputs = {
  token: process.env['INPUT_TOKEN'],
  repository: 'myyk/git-democracy',
} as any

test('test runs', () => {
  // make sure to run with `INPUT_TOKEN=your-token yarn run test`
  // Example on mocking patterns: https://github.com/actions/checkout/blob/master/__test__/input-helper.test.ts

  const octokit = new GitHub({
    auth: process.env['INPUT_TOKEN'] as string
  })

  // Mock getInput
  jest.spyOn(core, 'getInput').mockImplementation((name: string) => {
    return inputs[name]
  })

  // Mock github context
  jest.spyOn(github.context, 'issue', 'get').mockImplementation(() => {
    return {
      owner: 'myyk',
      repo: 'git-democracy',
      number: 11
    }
  })

  run()
})
