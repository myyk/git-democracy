import * as github from '@actions/github'
import {GitHub} from '@actions/github/lib/utils'
import {run} from '../src/main'

test('test runs', () => {
  // make sure to run with `INPUT_TOKEN=your-token yarn run test`
  // Example on mocking patterns: https://github.com/actions/checkout/blob/master/__test__/input-helper.test.ts
  process.env['INPUT_REPOSITORY'] = 'myyk/git-democracy'

  const octokit = new GitHub({
    auth: process.env['INPUT_TOKEN'] as string
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
