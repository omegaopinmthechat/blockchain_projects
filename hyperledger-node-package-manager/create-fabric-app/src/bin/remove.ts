#!/usr/bin/env node

import { Command } from "commander";
import { execa } from "execa";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import readline from "readline";

const program = new Command();

async function promptUser(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

async function stopDockerContainers(): Promise<void> {
  try {
    console.log(chalk.cyan("\n  Stopping Docker containers..."));
    
    // Get all Hyperledger Fabric containers
    const { stdout } = await execa("docker", [
      "ps",
      "-a",
      "--filter",
      "name=hyperledger",
      "-q",
    ]);

    if (stdout.trim()) {
      await execa("docker", ["rm", "-f", ...stdout.trim().split("\n")]);
      console.log(chalk.green("  ✔ Docker containers stopped"));
    } else {
      console.log(chalk.gray("  ↷ No Docker containers found"));
    }
  } catch (err) {
    console.log(chalk.yellow("  ⚠ Could not stop Docker containers"));
  }
}

async function removeDockerImages(removeImages: boolean): Promise<void> {
  if (!removeImages) return;

  try {
    console.log(chalk.cyan("\n  Removing Docker images..."));
    
    const { stdout } = await execa("docker", [
      "images",
      "hyperledger/*",
      "-q",
    ]);

    if (stdout.trim()) {
      const images = stdout.trim().split("\n");
      await execa("docker", ["rmi", "-f", ...images]);
      console.log(chalk.green(`  ✔ Removed ${images.length} Docker images (~5-7 GB freed)`));
    } else {
      console.log(chalk.gray("  ↷ No Docker images found"));
    }
  } catch (err) {
    console.log(chalk.yellow("  ⚠ Could not remove Docker images"));
  }
}

async function removeDockerVolumes(): Promise<void> {
  try {
    console.log(chalk.cyan("\n  Removing Docker volumes..."));
    
    const { stdout } = await execa("docker", ["volume", "ls", "-q"]);

    if (stdout.trim()) {
      const volumes = stdout.trim().split("\n");
      for (const volume of volumes) {
        try {
          await execa("docker", ["volume", "rm", volume]);
        } catch {
          // Volume might be in use, skip
        }
      }
      console.log(chalk.green("  ✔ Docker volumes cleaned"));
    }
  } catch (err) {
    console.log(chalk.gray("  ↷ No volumes to clean"));
  }
}

async function removeProjectDirectory(projectPath: string): Promise<void> {
  try {
    console.log(chalk.cyan("\n  Removing project directory..."));
    
    if (await fs.pathExists(projectPath)) {
      await fs.remove(projectPath);
      console.log(chalk.green(`  ✔ Removed: ${projectPath}`));
    } else {
      console.log(chalk.yellow(`  ⚠ Project not found: ${projectPath}`));
    }
  } catch (err) {
    console.log(chalk.red(`  ✖ Failed to remove project directory`));
    throw err;
  }
}

program
  .name("remove-fabric-app")
  .description("Remove Hyperledger Fabric projects and cleanup resources")
  .version("0.1.0")
  .argument("[project-name]", "Name of the project to remove")
  .option("--keep-images", "Keep Docker images (don't delete)")
  .option("--force", "Skip confirmation prompt")
  .action(async (projectName: string | undefined, opts) => {
    console.log(
      chalk.cyan.bold(`
  ╔════════════════════════════════════════════╗
  ║        remove-fabric-app                 ║
  ╚════════════════════════════════════════════╝
`)
    );

    try {
      const projectPath = projectName
        ? path.resolve(process.cwd(), projectName)
        : process.cwd();

      const projectExists = await fs.pathExists(projectPath);
      
      if (!projectExists && projectName) {
        console.log(chalk.yellow(`\n  Project "${projectName}" not found in current directory.`));
        process.exit(1);
      }

      // Show what will be removed
      console.log(chalk.white("\n  This will remove:"));
      console.log(chalk.gray(`  • Project directory: ${projectPath}`));
      console.log(chalk.gray(`  • Docker containers (Hyperledger Fabric)`));
      console.log(chalk.gray(`  • Docker volumes`));
      
      if (!opts.keepImages) {
        console.log(chalk.gray(`  • Docker images (~5-7 GB will be freed)`));
      }

      // Confirmation
      if (!opts.force) {
        const confirmed = await promptUser(
          chalk.yellow("\n  Are you sure you want to continue? (y/n): ")
        );

        if (!confirmed) {
          console.log(chalk.gray("\n  Removal cancelled.\n"));
          process.exit(0);
        }
      }

      console.log(chalk.cyan.bold("\n[1] Cleaning up Docker resources..."));
      
      // Stop containers
      await stopDockerContainers();

      // Remove volumes
      await removeDockerVolumes();

      // Remove images (optional)
      if (!opts.keepImages) {
        await removeDockerImages(true);
      } else {
        console.log(chalk.gray("\n  ↷ Keeping Docker images (--keep-images flag)"));
      }

      // Remove project directory
      if (projectName) {
        console.log(chalk.cyan.bold("\n[2] Removing project directory..."));
        await removeProjectDirectory(projectPath);
      }

      // Success message
      console.log(
        chalk.green.bold(`
  ╔════════════════════════════════════════════╗
  ║   ✔  Cleanup completed!                   ║
  ╚════════════════════════════════════════════╝
`)
      );

      if (opts.keepImages) {
        console.log(chalk.gray("  Docker images were kept. To remove them manually:"));
        console.log(chalk.white("  docker rmi $(docker images hyperledger/* -q)\n"));
      }

    } catch (err) {
      console.error(
        chalk.red("\n  ✖ Cleanup failed: ") +
          (err instanceof Error ? err.message : "Unknown error")
      );
      process.exit(1);
    }
  });

program.parse();
