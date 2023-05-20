import * as core from '@actions/core'
import { App, BlockAction, LogLevel } from '@slack/bolt'
import { WebClient } from '@slack/web-api'
import { UserDatabase, User } from './users'

const token = process.env.SLACK_BOT_TOKEN || ""
const signingSecret = process.env.SLACK_SIGNING_SECRET || ""
const slackAppToken = process.env.SLACK_APP_TOKEN || ""
const channel_id = process.env.SLACK_CHANNEL_ID || ""
const user_yaml_path = "./data/users.yaml"

const app = new App({
  token: token,
  signingSecret: signingSecret,
  appToken: slackAppToken,
  socketMode: true,
  port: 3000,
  logLevel: LogLevel.DEBUG,
});

async function run(): Promise<void> {
  try {
    const web = new WebClient(token);

    const github_server_url = process.env.GITHUB_SERVER_URL || "";
    const github_repos = process.env.GITHUB_REPOSITORY || "";
    const run_id = process.env.GITHUB_RUN_ID || "";
    const actionsUrl = `${github_server_url}/${github_repos}/actions/runs/${run_id}`;
    const workflow = process.env.GITHUB_WORKFLOW || "";
    const runnerOS = process.env.RUNNER_OS || "";
    const actor = process.env.GITHUB_ACTOR || "";

    // try {
    //   // users.list APIメソッドを使ってユーザーの一覧を取得
    //   const result = await web.users.list();
    //   // check not undefined
    //   if (result.members === undefined) {
    //     console.error("result.members is undefined");
    //     process.exit(1);
    //   }

    //   // 各ユーザーのメールアドレスを出力
    //   for (let user of result.members) {
    //     if (user) {
    //       console.log(`User: ${user.name}, Id: ${user.id}`);
    //     }
    //   }
    // } catch (error) {
    //   console.error(error);
    // }


    (async () => {
      await web.chat.postMessage({
        channel: channel_id,
        text: "GitHub Actions Approval request",
        blocks: [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `GitHub Actions Approval Request`,
            }
          },
          {
            "type": "section",
            "fields": [
              {
                "type": "mrkdwn",
                "text": `*GitHub Actor:*\n${actor}`
              },
              {
                "type": "mrkdwn",
                "text": `*Repos:*\n${github_server_url}/${github_repos}`
              },
              {
                "type": "mrkdwn",
                "text": `*Actions URL:*\n${actionsUrl}`
              },
              {
                "type": "mrkdwn",
                "text": `*GITHUB_RUN_ID:*\n${run_id}`
              },
              {
                "type": "mrkdwn",
                "text": `*Workflow:*\n${workflow}`
              },
              {
                "type": "mrkdwn",
                "text": `*RunnerOS:*\n${runnerOS}`
              }
            ]
          },
          {
            "type": "actions",
            "elements": [
              {
                "type": "button",
                "text": {
                  "type": "plain_text",
                  "emoji": true,
                  "text": "Approve"
                },
                "style": "primary",
                "value": "approve",
                "action_id": "slack-approval-approve"
              },
              {
                "type": "button",
                "text": {
                  "type": "plain_text",
                  "emoji": true,
                  "text": "Reject"
                },
                "style": "danger",
                "value": "reject",
                "action_id": "slack-approval-reject"
              }
            ]
          }
        ]
      });
    })();

    app.action('slack-approval-approve', async ({ ack, client, body, logger }) => {
      await ack();

      const userDatabase = new UserDatabase();
      try {
        userDatabase.load(user_yaml_path);
      } catch (e) {
        logger.error(`Failed to load yaml file: ${user_yaml_path}`);
        logger.error(e);
      }

      // TODO: slackに対してエラーであることを伝える
      // TODO: Databaseにuseridを保存する
      const user = userDatabase.searchBySlackUid(body.user.id);
      if (user === undefined) {
        logger.error(`User not found: ${body.user.id}`);
        process.exit(1);
      }
      if (user.github_userid === undefined) {
        logger.error(`user.github_userid is undefined`);
        process.exit(1);
      }
      if (user.slack_userid === undefined) {
        logger.error(`user.slack_userid is undefined`);
        process.exit(1);
      }
      if (user.github_userid === actor) {
        logger.error(`${actor} who merged PR shoud not be seme with ${user.github_userid}`);
        process.exit(1);
      }

      try {
        const response_blocks = (<BlockAction>body).message?.blocks
        response_blocks.pop()
        response_blocks.push({
          'type': 'section',
          'text': {
            'type': 'mrkdwn',
            'text': `Approved by <@${body.user.id}> `,
          },
        })
        await client.chat.update({
          channel: body.channel?.id || "",
          ts: (<BlockAction>body).message?.ts || "",
          blocks: response_blocks
        })
      } catch (error) {
        logger.error(error)
      }

      process.exit(0)
    });

    app.action('slack-approval-reject', async ({ ack, client, body, logger }) => {
      await ack();
      try {
        const response_blocks = (<BlockAction>body).message?.blocks
        response_blocks.pop()
        response_blocks.push({
          'type': 'section',
          'text': {
            'type': 'mrkdwn',
            'text': `Rejected by <@${body.user.id}>`,
          },
        })

        await client.chat.update({
          channel: body.channel?.id || "",
          ts: (<BlockAction>body).message?.ts || "",
          blocks: response_blocks
        })
      } catch (error) {
        logger.error(error)
      }

      process.exit(1)
    });

    (async () => {
      await app.start(3000);
      console.log('Waiting Approval reaction.....');
    })();
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()