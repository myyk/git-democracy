import {inspect} from "util";
import core from "@actions/core";
import {
  IssuesGetCommentResponseData,
} from "@octokit/types";
import { Octokit } from "@octokit/rest";

export const forIt = '+1';
export const againstIt = '-1';

interface Reactions {
  [forIt]: number;
  [againstIt]: number;
}

export async function readReactionsCounts(octokit: Octokit, owner: string, repo: string, commentId: number): Promise<Reactions> {
  if (isNaN(commentId)) {
    throw new Error('commentId not a number')
  }

  return octokit.issues.getComment({
    owner: owner,
    repo: repo,
    comment_id: commentId,
  }).then(({ data }) => {
    console.log(`data: ${inspect(data)}`);
    const dataWithReactions:any = data
    const reactions = dataWithReactions['reactions'];
    console.log(`reactions: ${inspect(reactions)}`);
    return {
      [forIt]: reactions[forIt],
      [againstIt]: reactions[againstIt],
    };
  });
}
