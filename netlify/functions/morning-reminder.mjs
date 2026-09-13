import { run } from '../lib/reminder-runner.mjs';
export const config={schedule:'* * * * *'};
export default async()=>run('morning');
