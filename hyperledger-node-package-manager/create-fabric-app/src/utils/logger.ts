import chalk from "chalk";


export const logger = {
  // General info — white
  info(message: string): void {
    console.log(chalk.white(`  ${message}`));
  },

  // Step heading — bold cyan with step number
  step(stepNumber: number, message: string): void {
    console.log(chalk.cyan.bold(`\n[${stepNumber}] ${message}`));
  },

  // Success — green tick
  success(message: string): void {
    console.log(chalk.green(`  ✔ ${message}`));
  },

  // Warning — yellow
  warn(message: string): void {
    console.log(chalk.yellow(`  ⚠ ${message}`));
  },

  // Error — red
  error(message: string): void {
    console.error(chalk.red(`  ✖ ${message}`));
  },

  // Skipped — gray (when something is already installed)
  skip(message: string): void {
    console.log(chalk.gray(`  ↷ ${message}`));
  },

  // Section divider
  divider(): void {
    console.log(chalk.gray("  " + "─".repeat(50)));
  },

  // Big banner at the start
  banner(projectName: string): void {
    console.log(
      chalk.cyan.bold(`
  ╔════════════════════════════════════════════╗
  ║        create-fabric-app                 ║
  ╚════════════════════════════════════════════╝
  `) +
        chalk.white(`  Setting up: `) +
        chalk.cyan.bold(projectName) +
        "\n",
    );
  },

  // Final success block
  done(projectName: string): void {
    console.log(
      chalk.green.bold(`
  ╔════════════════════════════════════════════╗
  ║   ✔  Fabric project ready!                ║
  ╚════════════════════════════════════════════╝
`) +
        chalk.white(`
  Next steps:

`) +
        chalk.cyan(`    cd ${projectName}\n`) +
        chalk.white(`
  Available commands:
`) +
        chalk.gray(`    npm run start-network     `) +
        chalk.white(`→ Start the Fabric test network\n`) +
        chalk.gray(`    npm run create-channel    `) +
        chalk.white(`→ Create a channel (mychannel)\n`) +
        chalk.gray(`    npm run deploy-chaincode  `) +
        chalk.white(`→ Deploy the basic chaincode\n`) +
        chalk.gray(`    npm run stop-network      `) +
        chalk.white(`→ Stop and clean up\n`) +
        chalk.white(`
  Edit your smart contract:  `) +
        chalk.cyan(`chaincode/basic/index.js\n`) +
        chalk.white(`  Edit your client app:      `) +
        chalk.cyan(`app/index.ts\n`),
    );
  },
};
