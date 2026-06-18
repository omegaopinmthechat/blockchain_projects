import os from "os";
import type { Platform } from "./install-prereqs.js";

export function detectOS(): Platform {
  const platform = os.platform();

  switch (platform) {
    case "win32":
      return "windows";
    case "linux":
      return "linux";
    case "darwin":
      return "mac";
    default:
      throw new Error(
        `Unsupported operating system: ${platform}. ` +
          `create-fabric-app supports Windows, Linux, and macOS.`,
      );
  }
}