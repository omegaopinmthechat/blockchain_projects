import { execa } from "execa";
import path from "path";
import fs from "fs-extra";
import { logger } from "../utils/logger.js";
import readline from "readline";

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

async function checkDiskSpace(path: string): Promise<number> {
  try {
    if (process.platform === "win32") {
      const result = await execa("wmic", [
        "logicaldisk",
        "where",
        `DeviceID="${path.substring(0, 2)}"`,
        "get",
        "FreeSpace",
      ]);
      const match = result.stdout.match(/\d+/);
      return match ? parseInt(match[0]) / (1024 * 1024 * 1024) : 0;
    } else {
      const result = await execa("df", ["-BG", path]);
      const lines = result.stdout.split("\n");
      if (lines.length > 1) {
        const match = lines[1].match(/\s+(\d+)G\s/);
        return match ? parseInt(match[1]) : 0;
      }
      return 0;
    }
  } catch {
    return 0;
  }
}

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

async function isDockerRunning(): Promise<boolean> {
  try {
    await execa("docker", ["info"], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

async function isDockerRunningWSL(): Promise<boolean> {
  try {
    await execa("wsl", ["bash", "-c", "docker info"], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

async function downloadInstallScript(destPath: string, platform: "windows" | "linux" | "mac"): Promise<void> {
  if (platform === "windows") {
    // On Windows, download inside WSL
    const wslPath = destPath
      .replace(/\\/g, "/")
      .replace(/^([A-Za-z]):/, (_, d) => `/mnt/${d.toLowerCase()}`);

    // Ensure directory exists in WSL
    const mkdirCmd = `mkdir -p ${JSON.stringify(wslPath)}`;
    await execa("wsl", ["bash", "-c", mkdirCmd]);

    const downloadCmd = `cd ${JSON.stringify(wslPath)} && curl -sSLO ${FABRIC_INSTALL_SCRIPT} && chmod +x install-fabric.sh`;
    await execa("wsl", ["bash", "-c", downloadCmd], { stdio: "inherit" });
  } else {
    // On Unix-like systems, download directly
    await execa("curl", ["-sSLO", FABRIC_INSTALL_SCRIPT], {
      cwd: destPath,
      stdio: "inherit",
    });

    // Make it executable
    await execa("chmod", ["+x", "install-fabric.sh"], { cwd: destPath });
  }
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
  // Handle spaces by properly escaping the path
  const wslPath = destPath
    .replace(/\\/g, "/")
    .replace(/^([A-Za-z]):/, (_, d) => `/mnt/${d.toLowerCase()}`);

  const fullCommand = `cd ${JSON.stringify(wslPath)} && bash install-fabric.sh ${args.join(" ")}`;

  await execa("wsl", ["bash", "-c", fullCommand], { stdio: "inherit" });
}

// main export

export async function installFabric(
  options: FabricInstallOptions,
  platform: "windows" | "linux" | "mac",
): Promise<void> {
  const { projectDir } = options;

  // 0. Check disk space
  logger.info("Checking available disk space...");
  const REQUIRED_SPACE_GB = 10;
  const availableSpace = await checkDiskSpace(projectDir);

  if (availableSpace === 0) {
    logger.warn("Could not determine available disk space. Proceeding anyway...");
  } else if (availableSpace < REQUIRED_SPACE_GB) {
    logger.error(
      `Insufficient disk space. Required: ${REQUIRED_SPACE_GB}GB, Available: ${availableSpace.toFixed(2)}GB\n` +
        "  → Please free up some space and try again."
    );
    process.exit(1);
  } else {
    logger.success(
      `Available disk space: ${availableSpace.toFixed(2)}GB (Required: ~${REQUIRED_SPACE_GB}GB)`
    );

    const confirmed = await promptUser(
      `\n  Hyperledger Fabric installation will download:\n` +
        `  - Docker images (~4-5 GB)\n` +
        `  - Binaries and samples (~2-3 GB)\n` +
        `  - Total: ~7-8 GB\n\n` +
        `  Continue? (y/n): `
    );

    if (!confirmed) {
      logger.warn("Installation cancelled by user.");
      process.exit(0);
    }
  }

  // 1. Make sure the project directory exists
  await fs.ensureDir(projectDir);

  // 2. Check Docker is running before we attempt anything
  logger.info("Checking Docker is running...");
  const dockerOk = platform === "windows" 
    ? await isDockerRunningWSL()
    : await isDockerRunning();

  if (!dockerOk) {
    const errorMsg = platform === "windows"
      ? "Docker is not running in WSL.\n" +
        "  → Please start Docker inside WSL and re-run."
      : "Docker is not running.\n" +
        "  → Please start Docker Desktop (or the Docker daemon) and re-run.";
    logger.error(errorMsg);
    process.exit(1);
  }

  logger.success("Docker is running.");

  // 3. Download Hyperledger's official install script into the project dir
  logger.info("Downloading Hyperledger Fabric install script...");

  try {
    await downloadInstallScript(projectDir, platform);
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
    
    // Verify fabric-samples was created
    const fabricSamplesPath = path.join(projectDir, "fabric-samples");
    if (!(await fs.pathExists(fabricSamplesPath))) {
      throw new Error(
        `fabric-samples directory was not created.\n` +
        `Expected location: ${fabricSamplesPath}\n` +
        `The installation script may have failed silently.`
      );
    }
    
    logger.success(`fabric-samples created at: ${fabricSamplesPath}`);
  } catch (err) {
    logger.error("Fabric installation failed.");
    if (err instanceof Error) {
      logger.error(err.message);
    }
    throw err;
  }

  // 5. Clean up the install script — user doesn't need it in their project
  const scriptPath = path.join(projectDir, "install-fabric.sh");
  await fs.remove(scriptPath);
}
