import {
  readReactionsCounts,
  readReactionsCountsFromSummary,
  weightedVoteTotaling
} from '../src/reactions'
import {Octokit} from '@octokit/rest'

test('readReactionsCounts throws invalid number', async () => {
  const octokit = new Octokit()
  await expect(
    readReactionsCounts(
      octokit,
      'foo',
      'bar',
      Promise.reject('commentId not a number')
    )
  ).rejects.toEqual('commentId not a number')
})

test('readReactionsCounts can reactions on issue', async () => {
  // make sure to run with `INPUT_TOKEN=your-token npm test`
  const octokit = new Octokit({
    auth: process.env['INPUT_TOKEN'] as string
  })
  // TODO: Setup a better test case with values that are not the same. Probably need to lock commment if possible.
  const result = readReactionsCounts(
    octokit,
    'myyk',
    'git-democracy',
    Promise.resolve(677573350)
  )
  await expect(result).resolves.toEqual(new Map([['myyk', 0]]))
})

test('readReactionsCountsFromSummary throws invalid number', async () => {
  const octokit = new Octokit()
  await expect(
    readReactionsCountsFromSummary(
      octokit,
      'foo',
      'bar',
      Promise.reject('commentId not a number')
    )
  ).rejects.toEqual('commentId not a number')
})

test('readReactionsCountsFromSummary can getComment on issue', async () => {
  // make sure to run with `INPUT_TOKEN=your-token npm test`
  const octokit = new Octokit({
    auth: process.env['INPUT_TOKEN'] as string,
    previews: ['squirrel-girl']
  })
  // TODO: Setup a better test case with values that are not the same. Probably need to lock commment if possible.
  const result = readReactionsCountsFromSummary(
    octokit,
    'myyk',
    'git-democracy',
    Promise.resolve(677573350)
  )
  await expect(result).resolves.toHaveProperty('+1', 1)
  await expect(result).resolves.toHaveProperty('-1', 1)
  await expect(result).resolves.toHaveProperty('numVoters', 0)
})

type weightedVoteTotalingTestCase = {
  userReactions: readonly (readonly [string, number])[]
  voters: readonly (readonly [string, number])[]
  expectedForIt: number
  expectedAgainstIt: number
  expectedNumVoters: number
}

async function testWeightedVoteTotaling(
  testCase: weightedVoteTotalingTestCase
) {
  const result = weightedVoteTotaling(
    Promise.resolve(new Map(testCase.userReactions)),
    Promise.resolve(new Map(testCase.voters))
  )
  await expect(result).resolves.toHaveProperty('+1', testCase.expectedForIt)
  await expect(result).resolves.toHaveProperty('-1', testCase.expectedAgainstIt)
  await expect(result).resolves.toHaveProperty(
    'numVoters',
    testCase.expectedNumVoters
  )
}

test('weightedVoteTotaling can total weighted vote forIt', async () => {
  testWeightedVoteTotaling({
    userReactions: [
      ['foo', 123],
      ['bar', 345],
      ['baz', 9999]
    ],
    voters: [
      ['foo', 2],
      ['bar', 1]
    ],
    expectedForIt: 2 * 123 + 1 * 345,
    expectedAgainstIt: 0,
    expectedNumVoters: 2
  })
})

test('weightedVoteTotaling can total weighted vote againstIt', async () => {
  testWeightedVoteTotaling({
    userReactions: [
      ['foo', -123],
      ['bar', -345],
      ['baz', -9999]
    ],
    voters: [
      ['foo', 2],
      ['bar', 1]
    ],
    expectedForIt: 0,
    expectedAgainstIt: 2 * 123 + 1 * 345,
    expectedNumVoters: 2
  })
})

test('weightedVoteTotaling can total weighted for and againstIt', async () => {
  testWeightedVoteTotaling({
    userReactions: [
      ['foo', -123],
      ['bar', 345],
      ['baz', -9999]
    ],
    voters: [
      ['foo', 2],
      ['bar', 1]
    ],
    expectedForIt: 1 * 345,
    expectedAgainstIt: 2 * 123,
    expectedNumVoters: 2
  })
})

test('weightedVoteTotaling handle no voters', async () => {
  testWeightedVoteTotaling({
    userReactions: [
      ['foo', -123],
      ['bar', 345],
      ['baz', -9999]
    ],
    voters: [],
    expectedForIt: 0,
    expectedAgainstIt: 0,
    expectedNumVoters: 0
  })
})

test('weightedVoteTotaling handle no reactions', async () => {
  testWeightedVoteTotaling({
    userReactions: [],
    voters: [
      ['foo', 2],
      ['bar', 1]
    ],
    expectedForIt: 0,
    expectedAgainstIt: 0,
    expectedNumVoters: 0
  })
})
