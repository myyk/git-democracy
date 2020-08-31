import {inspect} from "util";
import * as core from '@actions/core'
import {github} from '@actions/github'
import {wait} from './wait'
import {readReactionsCounts} from './reactions'

async function run(): Promise<void> {
  try {
    const inputs = {
      token: core.getInput("token"),
      repository: core.getInput("repository"),
      commentId: +(core.getInput("comment-id") as string),
    };
    core.debug(`Inputs: ${inspect(inputs)}`);

    const repository = inputs.repository
      ? inputs.repository
      : process.env.GITHUB_REPOSITORY as string;
    const [owner, repo] = repository.split("/");
    core.debug(`repository: ${owner}/${repo}`);

    const octokit = github.getOctokit(
      inputs.token,
      {
        previews: ['squirrel-girl'],
      },
    );

    const reactionCountsPromise = readReactionsCounts(octokit, owner, repo, inputs.commentId)
    // const votingConfigPromise = readVotingConfig()

    const reactionCounts = await reactionCountsPromise
    // const votingConfig = await votingConfigPromise // TODO: add voting config to action outpus

    // core.setOutput("for", reactionCounts[forIt]);
    // core.setOutput("against", reactionCounts[againstIt]);
    core.setOutput("for", 123);
    core.setOutput("against", 456);


    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    console.log(`The event payload: ${payload}`);
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
