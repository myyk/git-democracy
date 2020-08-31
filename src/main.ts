import {inspect} from 'util'
import * as core from '@actions/core'
import * as github from '@actions/github'
import {readReactionsCounts, forIt, againstIt} from './reactions'
import {Octokit} from '@octokit/rest'

async function run(): Promise<void> {
  try {
    const inputs = {
      token: core.getInput('token'),
      repository: core.getInput('repository'),
      commentId: Number(core.getInput('commentId'))
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

    const reactionCountsPromise = readReactionsCounts(
      octokit,
      owner,
      repo,
      inputs.commentId
    )
    // const votingConfigPromise = readVotingConfig()

    const reactionCounts = await reactionCountsPromise.catch(reason => {
      core.setFailed(`could not get reactions: ${reason}`)
    })
    if (reactionCounts == null) {
      return
    }

    console.log(`reactionCounts: ${inspect(reactionCounts)}`)

    // const votingConfig = await votingConfigPromise // TODO: add voting config to action outpus

    core.setOutput('for', reactionCounts[forIt])
    core.setOutput('against', reactionCounts[againstIt])

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    console.log(`The event payload: ${payload}`)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
