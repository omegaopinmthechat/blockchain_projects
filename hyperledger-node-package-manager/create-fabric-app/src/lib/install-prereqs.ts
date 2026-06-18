//todo: Add icons loading etc using a npm package i can't remeber rn

import { execa } from "execa";

export type Platform = "windows" | "linux" | "mac";

// helpers

async function commandExists(command: string): Promise<boolean> {
  try {
    // "where" on Windows, "which" on Linux/Mac
    const checker = process.platform === "win32" ? "where" : "which";
    await execa(checker, [command]);
    return true;
  } catch {
    return false;
  }
}

async function runCommand(
  command: string,
  args: string[],
  label?: string,
): Promise<void> {
  if (label) console.log(label);
  await execa(command, args, { stdio: "inherit" });
}

// Windows

async function installWindowsPrereqs(): Promise<void> {
  // Step 1: check if WSL is already available
  const wslAvailable = await commandExists("wsl");

  if (!wslAvailable) {
    console.log("WSL not found. Installing WSL2...");
    console.log("  Windows will require a REBOOT after WSL installs.");
    console.log("   After rebooting, run this command again to continue.\n");

    await runCommand("powershell", ["-Command", "wsl --install"]);

    // Can't continue — WSL needs a reboot to be usable
    console.log("\n WSL installed. Please REBOOT your machine, then re-run.");
    process.exit(0);
  }

  // Step 2: check Docker inside WSL
  const dockerInWSL = await checkCommandInWSL("docker");
  if (!dockerInWSL) {
    console.log("Installing Docker inside WSL...");
    await runCommand("wsl", [
      "bash",
      "-c",
      "curl -fsSL https://get.docker.com | sh && sudo usermod -aG docker $USER",
    ]);
  } else {
    console.log(" Docker already installed in WSL, skipping.");
  }

  // Step 3: check Go inside WSL
  const goInWSL = await checkCommandInWSL("go");
  if (!goInWSL) {
    console.log("Installing Go inside WSL...");
    await runCommand("wsl", [
      "bash",
      "-c",
      "sudo apt-get update && sudo apt-get install -y golang-go",
    ]);
  } else {
    console.log(" Go already installed in WSL, skipping.");
  }

  // Step 4: ensure curl inside WSL
  const curlInWSL = await checkCommandInWSL("curl");
  if (!curlInWSL) {
    await runCommand("wsl", ["bash", "-c", "sudo apt-get install -y curl"]);
  }
}

// Runs a "which <cmd>" inside WSL and returns true if found
async function checkCommandInWSL(command: string): Promise<boolean> {
  try {
    await execa("wsl", ["bash", "-c", `which ${command}`]);
    return true;
  } catch {
    return false;
  }
}

// Linux

async function installLinuxPrereqs(): Promise<void> {
  // Always update apt first
  await runCommand(
    "bash",
    ["-c", "sudo apt-get update"],
    "Updating package lists...",
  );

  if (!(await commandExists("curl"))) {
    await runCommand(
      "bash",
      ["-c", "sudo apt-get install -y curl"],
      "Installing curl...",
    );
  } else {
    console.log(" curl already installed, skipping.");
  }

  if (!(await commandExists("docker"))) {
    await runCommand(
      "bash",
      [
        "-c",
        "curl -fsSL https://get.docker.com | sh && sudo usermod -aG docker $USER",
      ],
      "Installing Docker...",
    );
    console.log(
      "  Docker installed. You may need to log out and back in for group changes to take effect.",
    );
  } else {
    console.log(" Docker already installed, skipping.");
  }

  if (!(await commandExists("go"))) {
    await runCommand(
      "bash",
      ["-c", "sudo apt-get install -y golang-go"],
      "Installing Go...",
    );
  } else {
    console.log(" Go already installed, skipping.");
  }
}

// Mac

async function installMacPrereqs(): Promise<void> {
  // Check Homebrew first — nothing else works without it
  if (!(await commandExists("brew"))) {
    console.log("Homebrew not found. Installing Homebrew...");
    await runCommand("bash", [
      "-c",
      '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
    ]);
  } else {
    console.log(" Homebrew already installed, skipping.");
  }

  if (!(await commandExists("go"))) {
    await runCommand("bash", ["-c", "brew install go"], "Installing Go...");
  } else {
    console.log(" Go already installed, skipping.");
  }

  if (!(await commandExists("docker"))) {
    // --cask installs Docker Desktop (the full app), not just the CLI
    await runCommand(
      "bash",
      ["-c", "brew install --cask docker"],
      "Installing Docker Desktop...",
    );
    console.log(
      "  Please open Docker Desktop manually once to finish setup.",
    );
  } else {
    console.log(" Docker already installed, skipping.");
  }
}

// Entry point

export async function installPrereqs(platform: Platform): Promise<void> {
  switch (platform) {
    case "windows":
      await installWindowsPrereqs();
      break;

    case "linux":
      await installLinuxPrereqs();
      break;

    case "mac":
      await installMacPrereqs();
      break;

    default: {
      const exhaustiveCheck: never = platform;
      throw new Error(`Unsupported platform: ${exhaustiveCheck}`);
    }
  }
}
