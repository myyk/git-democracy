import {inspect} from 'util'
import * as core from '@actions/core'
import * as github from '@actions/github'
import {readReactionsCounts, forIt, againstIt} from './reactions'
import {readVotingConfig} from './config'
import {Octokit} from '@octokit/rest'

async function run(): Promise<void> {
  try {
    const inputs = {
      token: core.getInput('token'),
      repository: core.getInput('repository'),
      commentId: Number(core.getInput('commentId')) // TODO: Search for this
    }
    core.debug(`Inputs: ${inspect(inputs)}`)

    const repository = inputs.repository
      ? inputs.repository
      : (process.env.GITHUB_REPOSITORY as string)
    const [owner, repo] = repository.split('/')
    core.debug(`repository: ${owner}/${repo}`)

    const octokit = github.getOctokit(inputs.token, {
      previews: ['squirrel-girl']
    }) as Octokit

    // TODO: Look for voting commentID
    // TODO: If can't find the commentID create new voting comment and return

    // TODO: Read voters file.
    // TODO: User voters in readReactionsCounts.

    const reactionCountsPromise = readReactionsCounts(
      octokit,
      owner,
      repo,
      inputs.commentId
    )
    const votingConfigPromise = readVotingConfig(`./.voting.yml`)

    // TODO: Compute voting result.
    // TODO: Write summary to comment.
    // TODO: Fail if the vote didn't pass.

    const votes = await reactionCountsPromise
    core.debug(`reactionCounts: ${inspect(votes)}`)

    const votingConfig = await votingConfigPromise

    // TODO: add voting config to action outpus
    core.setOutput('for', votes[forIt])
    core.setOutput('against', votes[againstIt])
    core.setOutput('votingConfig', votingConfig)

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    core.debug(`The event payload: ${payload}`)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
