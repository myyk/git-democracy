import {readVotingConfig, Config as VotingConfig} from '../src/config'

test('readVotingConfig can read a valid config', async () => {
  await expect(
    readVotingConfig('./__tests__/data/voting-valid.yml')
  ).resolves.toEqual(
    new VotingConfig({
      percentageToApprove: 75,
      minVotersRequired: 10,
      minVotingWindowMinutes: 3600
    })
  )
})

test('readVotingConfig has error on empty config', async () => {
  await expect(
    readVotingConfig('./__tests__/data/voting-empty.yml')
  ).rejects.toThrowError('config data is not object type')
})

test('readVotingConfig has no error on missing percentageToApprove', async () => {
  await expect(
    readVotingConfig('./__tests__/data/voting-missing-percentageToApprove.yml')
  ).resolves.toEqual(
    new VotingConfig({
      percentageToApprove: 0,
      minVotersRequired: 10,
      minVotingWindowMinutes: 3600
    })
  )
})

test('readVotingConfig has error on invalid percentageToApprove', async () => {
  await expect(
    readVotingConfig('./__tests__/data/voting-invalid-percentageToApprove.yml')
  ).rejects.toThrowError()
})

test('readVotingConfig has error on invalid minVotersRequired', async () => {
  await expect(
    readVotingConfig('./__tests__/data/voting-invalid-minVotersRequired.yml')
  ).resolves.toEqual(
    new VotingConfig({
      percentageToApprove: 75,
      minVotersRequired: 0,
      minVotingWindowMinutes: 3600
    })
  )
})

test('readVotingConfig has error on invalid minVotingWindowMinutes', async () => {
  await expect(
    readVotingConfig(
      './__tests__/data/voting-invalid-minVotingWindowMinutes.yml'
    )
  ).resolves.toEqual(
    new VotingConfig({
      percentageToApprove: 75,
      minVotersRequired: 10,
      minVotingWindowMinutes: 0
    })
  )
})
