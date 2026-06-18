#!/usr/bin/env node

import { Command } from "commander";
import { detectOS } from "../lib/detect-os.js";
import { installPrereqs } from "../lib/install-prereqs.js";
import { installFabric } from "../lib/install-fabric.js";
import { scaffold } from "../lib/scaffold.js";
import { logger } from "../utils/logger.js";
import path from "path";

const program = new Command();

program
  .name("create-fabric-app")
  .description("Zero-config Hyperledger Fabric scaffolder")
  .version("0.1.0")
  .argument("[project-name]", "Name of your project", "my-fabric-app")
  .option("--fabric-version <version>", "Fabric version to install")
  .option("--ca-version <version>", "Fabric CA version to install")
  .action(async (projectName: string, opts) => {
    const projectDir = path.resolve(process.cwd(), projectName);
    const platform = detectOS();

    logger.banner(projectName);

    try {
      logger.step(1, "Detecting operating system...");
      logger.success(`Detected: ${platform}`);

      logger.step(2, "Installing prerequisites...");
      await installPrereqs(platform);
      logger.success("Prerequisites installed successfully.");

      logger.step(3, "Installing Hyperledger Fabric...");
      await installFabric(
        {
          projectDir,
          fabricVersion: opts.fabricVersion,
          caVersion: opts.caVersion,
        },
        platform,
      );
      logger.success("Hyperledger Fabric installation complete.");

      logger.step(4, "Scaffolding project...");
      await scaffold({ projectName, projectDir });
      logger.success("Project scaffolding complete.");

      logger.done(projectName);
    } catch (err) {
      // Clean user-facing error — no raw stack trace
      console.error(""); // Empty line
      logger.error(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
      logger.warn("Run with DEBUG=1 for full details.");
      
      if (process.env["DEBUG"]) {
        console.error("\nFull error details:");
        console.error(err);
      }
      
      // Provide helpful next steps
      console.error("\nTroubleshooting steps:");
      console.error("1. Ensure Docker Desktop is running");
      console.error("2. Check you have at least 10 GB free space");
      console.error("3. Try running with: DEBUG=1 npx create-fabric-app " + projectName);
      console.error("4. Check ISSUES.md for common problems\n");
      
      process.exit(1);
    }
  });

program.parse();