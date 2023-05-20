import * as yaml from 'js-yaml';
import * as fs from 'fs';

export type User = {
    slack_userid: string,
    github_userid: string,
}

export class UserDatabase {
    private users: Array<User>;

    constructor() {
        this.users = [];
    }

    public load(yamlFilePath: string): void {
        let yamlStr = fs.readFileSync(yamlFilePath, 'utf8');
        this.users = yaml.load(yamlStr) as Array<User>;
    }

    public searchBySlackUid(uid: string): User | undefined {
        let user = this.users.find(u => u.slack_userid === uid);
        if (user) {
            return user;
        } else {
            console.log(`User not found: ${uid}`);
            return undefined;
        }
    }
}