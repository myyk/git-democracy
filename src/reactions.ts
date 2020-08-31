import {inspect} from "util";
import core from "@actions/core";
import {
  IssuesGetCommentResponseData,
} from "@octokit/types";
import { Octokit } from "@octokit/rest";

// const forIt = '+1';
// const againstIt = '-1';
//
// interface Reactions {
//   [forIt]: number; // ok, length is a number
//   [againstIt]: string; // ok, name is a string
// }

export function readReactionsCounts(octokit: Octokit, owner: string, repo: string, commentId: number): Promise<IssuesGetCommentResponseData | null> {
  return octokit.issues.getComment({
    owner: repo[0],
    repo: repo[1],
    comment_id: commentId,
  }).then(({ data }) => {
    core.info(`data: ${inspect(data)}`);
    // core.info(`reactions: ${inspect(data.reactions)}`);
    // core.info(`+1s '${data.reactions[forIt]}'`);
    // return data.reactions;
    return data;
  }).catch((reason) => {
    core.setFailed(`could not get reactions: ${reason}`);
    return null;
  });
}
