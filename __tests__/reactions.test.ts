import {readReactionsCounts} from '../src/reactions'
import {Octokit} from '@octokit/rest'

test('throws invalid number', async () => {
  const input = parseInt('foo', 10)
  const octokit = new Octokit()
  await expect(
    readReactionsCounts(octokit, 'foo', 'bar', input)
  ).rejects.toThrow('commentId not a number')
})

test('readReactionsCounts can getComment on issue', async () => {
  // make sure to run with `INPUT_TOKEN=your-token npm test`
  const octokit = new Octokit({
    auth: process.env['INPUT_TOKEN'] as string,
    previews: ['squirrel-girl']
  })
  // TODO: Setup a better test case with values that are not the same. Probably need to lock commment if possible.
  const result = readReactionsCounts(
    octokit,
    'myyk',
    'git-democracy',
    677573350
  )
  await expect(result).resolves.toHaveProperty('+1', 1)
  await expect(result).resolves.toHaveProperty('-1', 1)
})
