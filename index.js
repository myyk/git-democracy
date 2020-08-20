const core = require('@actions/core');
const github = require('@actions/github');

try {
  // `comment-id` input defined in action metadata file
  const commentId = core.getInput('comment-id');
  console.log(`Voting Comment ${commentId}`);

  core.setOutput("for", 123);
  core.setOutput("against", 456);
  
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}
