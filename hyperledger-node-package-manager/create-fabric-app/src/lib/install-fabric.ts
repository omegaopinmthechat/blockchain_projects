import { execa } from "execa";
import path from "path";
import fs from "fs-extra";
import { logger } from "../utils/logger.js";

// Hyperledger's official install script URL
const FABRIC_INSTALL_SCRIPT =
  "https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh";

// What we ask the script to install
// d = docker images, b = binaries, s = fabric-samples
const FABRIC_COMPONENTS = ["d", "b", "s"];

export interface FabricInstallOptions {
  fabricVersion?: string; // default: latest
  caVersion?: string; // default: latest
  projectDir: string;
}

// helpers

async function isDockerRunning(): Promise<boolean> {
  try {
    await execa("docker", ["info"], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

async function downloadInstallScript(destPath: string): Promise<void> {
  await execa("curl", ["-sSLO", FABRIC_INSTALL_SCRIPT], {
    cwd: destPath,
    stdio: "inherit",
  });

  // Make it executable
  await execa("chmod", ["+x", "install-fabric.sh"], { cwd: destPath });
}

async function runInstallScript(
  destPath: string,
  options: FabricInstallOptions,
): Promise<void> {
  const args: string[] = [];

  // Add version flags if specified
  if (options.fabricVersion) {
    args.push("--fabric-version", options.fabricVersion);
  }

  if (options.caVersion) {
    args.push("--ca-version", options.caVersion);
  }

  // Add components to install: d (docker), b (binaries), s (samples)
  args.push(...FABRIC_COMPONENTS);

  await execa("bash", ["install-fabric.sh", ...args], {
    cwd: destPath,
    stdio: "inherit",
  });
}

async function runInstallScriptWSL(
  destPath: string,
  options: FabricInstallOptions,
): Promise<void> {
  // On Windows we run the script inside WSL
  const args: string[] = [];

  if (options.fabricVersion) {
    args.push("--fabric-version", options.fabricVersion);
  }

  if (options.caVersion) {
    args.push("--ca-version", options.caVersion);
  }

  args.push(...FABRIC_COMPONENTS);

  // Convert Windows path to WSL path e.g. C:\foo → /mnt/c/foo
  const wslPath = destPath
    .replace(/\\/g, "/")
    .replace(/^([A-Za-z]):/, (_, d) => `/mnt/${d.toLowerCase()}`);

  const fullCommand = `cd "${wslPath}" && bash install-fabric.sh ${args.join(" ")}`;

  await execa("wsl", ["bash", "-c", fullCommand], { stdio: "inherit" });
}

// main export

export async function installFabric(
  options: FabricInstallOptions,
  platform: "windows" | "linux" | "mac",
): Promise<void> {
  const { projectDir } = options;

  // 1. Make sure the project directory exists
  await fs.ensureDir(projectDir);

  // 2. Check Docker is running before we attempt anything
  logger.info("Checking Docker is running...");
  const dockerOk = await isDockerRunning();

  if (!dockerOk) {
    logger.error(
      "Docker is not running.\n" +
        "  → Please start Docker Desktop (or the Docker daemon) and re-run.",
    );
    process.exit(1);
  }

  logger.success("Docker is running.");

  // 3. Download Hyperledger's official install script into the project dir
  logger.info("Downloading Hyperledger Fabric install script...");

  try {
    await downloadInstallScript(projectDir);
    logger.success("Install script downloaded.");
  } catch (err) {
    logger.error("Failed to download install script.");
    throw err;
  }

  // 4. Run the install script — pulls Docker images + binaries (~5-10 min)
  logger.info("Installing Hyperledger Fabric (pulling Docker images + binaries)... This can take 5–10 minutes depending on your connection.");

  try {
    if (platform === "windows") {
      await runInstallScriptWSL(projectDir, options);
    } else {
      await runInstallScript(projectDir, options);
    }

    logger.success("Hyperledger Fabric installed successfully.");
  } catch (err) {
    logger.error("Fabric installation failed.");
    throw err;
  }

  // 5. Clean up the install script — user doesn't need it in their project
  const scriptPath = path.join(projectDir, "install-fabric.sh");
  await fs.remove(scriptPath);
}
