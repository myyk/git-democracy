const { inspect } = require("util");
const core = require('@actions/core');
const github = require('@actions/github');

const forIt = "+1";
const againstIt = "-1";

async function readReactionsCounts(octokit, repo, commentId, reactionsSet) {
  let reactions = [...reactionsSet];

  let responses = await Promise.allSettled(
    reactions.map(async (reaction) => {
      await octokit.reactions.listForPullRequestReviewComment({
        owner: repo[0],
        repo: repo[1],
        comment_id: commentId,
        content: reaction,
        mediaType: {
          previews: [
            'squirrel-girl'
          ]
        },
      });
      // TODO: will need to follow get later pages if there are a lot of reactions

      core.info(`Getting '${reaction}' reactions.`);
    })
  );

  let results = new Map();
  for (let i = 0, l = responses.length; i < l; i++) {
    let reaction = reactions[i]
    let response = responses[i]
    if (response.status === "fulfilled") {
      core.info(
        `Reading reactions '${reaction}' from comment id '${commentId}'.`
      );
      core.info(
        `Response: '${response}'`
      );
      results.set(reaction, response.data.length);
    } else if (responses[i].status === "rejected") {
      core.info(
        `Reading reactions '${reaction}' from comment id '${commentId}' failed with ${response.reason}.`
      );
      results.set(reaction, 0);
    }
  }

  return results;
}

async function run() {
  try {
    // `comment-id` input defined in action metadata file
    const inputs = {
      token: core.getInput("token"),
      repository: core.getInput("repository"),
      commentId: core.getInput("comment-id"),
    };
    core.debug(`Inputs: ${inspect(inputs)}`);

    const repository = inputs.repository
      ? inputs.repository
      : process.env.GITHUB_REPOSITORY;
    const repo = repository.split("/");
    core.debug(`repository: ${repository}`);

    const octokit = github.getOctokit(inputs.token);

    const reactionsToCount = new Set([forIt, againstIt]);
    const reactionCounts = readReactionsCounts(octokit, repo, inputs.commentId, reactionsToCount)

    core.setOutput("for", reactionCounts.get(forIt));
    core.setOutput("against", reactionCounts.get(againstIt));

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    console.log(`The event payload: ${payload}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
