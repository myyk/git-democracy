import {readVotingConfig, Config as VotingConfig} from '../src/config'

test('readVotingConfig can read a valid config', async () => {
  await expect(
    readVotingConfig('./__tests__/.voting.yml')
  ).resolves.toEqual(new VotingConfig({percentageToApprove: 75, minVotersRequired: 10, minVotingWindowMinutes: 3600}))
})
