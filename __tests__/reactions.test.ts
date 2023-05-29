import {readReactionsCounts, weightedVoteTotaling} from '../src/reactions'
import {GitHub} from '@actions/github/lib/utils'

test('readReactionsCounts can count reactions on issue', async () => {
  // make sure to run with `INPUT_TOKEN=your-token yarn run test`
  const octokit = new GitHub({
    auth: process.env['INPUT_TOKEN'] as string
  })
  // TODO: Setup a better test case with values that are not the same. Probably need to lock commment if possible.
  const result = readReactionsCounts(octokit, 'myyk', 'git-democracy', 71)
  await expect(result).resolves.toEqual(new Map([['myyk', 1]]))
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
  const createdAt = new Date()
  const result = weightedVoteTotaling(
    Promise.resolve(new Map(testCase.userReactions)),
    Promise.resolve(new Map(testCase.voters)),
    Promise.resolve(createdAt)
  )
  await expect(result).resolves.toHaveProperty('+1', testCase.expectedForIt)
  await expect(result).resolves.toHaveProperty('-1', testCase.expectedAgainstIt)
  await expect(result).resolves.toHaveProperty(
    'numVoters',
    testCase.expectedNumVoters
  )
  await expect(result).resolves.toHaveProperty('voteStartedAt', createdAt)
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
