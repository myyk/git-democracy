import {readVoters, Voters} from '../src/voters'

test('readVoters can read a valid file', async () => {
  const expected = new Voters()
  expected.set('abc', 1)
  expected.set('xyz', 2)
  expected.set('foo', 1)

  await expect(
    readVoters('./__tests__/data/voters-valid.yml')
  ).resolves.toEqual(expected)
})
