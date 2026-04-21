import { NextResponse } from "next/server";

const OWNER = "omegaopinmthechat";
const REPO = "blockchain_projects";
const CACHE_SECONDS = 3600; // 1 hour cache

const RELEASES_PAGE_URL = `https://github.com/${OWNER}/${REPO}/releases`;
const RELEASES_LATEST_URL = `${RELEASES_PAGE_URL}/latest`;
const GITHUB_LATEST_RELEASE_API = `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`;

function toAbsoluteGithubUrl(relativeOrAbsolute) {
  if (typeof relativeOrAbsolute !== "string" || !relativeOrAbsolute.trim()) {
    return "";
  }

  if (/^https?:\/\//i.test(relativeOrAbsolute)) {
    return relativeOrAbsolute;
  }

  return `https://github.com${relativeOrAbsolute}`;
}

function buildEmptyRelease() {
  return {
    versionTag: "latest",
    versionLabel: "latest",
    downloadUrl: "",
    releaseUrl: RELEASES_PAGE_URL,
  };
}

function toVersionLabel(tag) {
  return String(tag || "latest").replace(/^v/i, "") || "latest";
}

function chooseInstallerAsset(assets) {
  const exeAssets = Array.isArray(assets)
    ? assets.filter(
        (asset) =>
          typeof asset?.name === "string" &&
          asset.name.toLowerCase().endsWith(".exe") &&
          typeof asset?.browser_download_url === "string"
      )
    : [];

  return exeAssets.find((asset) => /setup|installer/i.test(asset.name)) || exeAssets[0] || null;
}

async function fetchFromGithubApi() {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "confcert-offline-playground",
  };

  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_RELEASES_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(GITHUB_LATEST_RELEASE_API, {
    headers,
    next: { revalidate: CACHE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`GitHub latest release API failed (${response.status}).`);
  }

  const data = await response.json();
  const asset = chooseInstallerAsset(data?.assets);
  if (!asset) {
    throw new Error("No Windows installer (.exe) asset found in latest release.");
  }

  const versionTag =
    typeof data?.tag_name === "string" && data.tag_name.trim() ? data.tag_name.trim() : "latest";

  return {
    versionTag,
    versionLabel: toVersionLabel(versionTag),
    downloadUrl: asset.browser_download_url,
    releaseUrl:
      typeof data?.html_url === "string" && data.html_url.trim()
        ? data.html_url
        : RELEASES_PAGE_URL,
  };
}

async function resolveViaLatestReleaseRedirect() {
  const latestResponse = await fetch(RELEASES_LATEST_URL, {
    redirect: "follow",
    next: { revalidate: CACHE_SECONDS },
  });

  const match = latestResponse.url.match(/\/releases\/tag\/([^/?#]+)/i);
  if (!match || !match[1]) {
    return null;
  }

  const versionTag = decodeURIComponent(match[1]);
  const versionLabel = toVersionLabel(versionTag);
  const releaseUrl = `${RELEASES_PAGE_URL}/tag/${encodeURIComponent(versionTag)}`;
  let downloadUrl = "";

  const expandedAssetsUrl = `${RELEASES_PAGE_URL}/expanded_assets/${encodeURIComponent(versionTag)}`;
  const expandedAssetsResponse = await fetch(expandedAssetsUrl, {
    next: { revalidate: CACHE_SECONDS },
  });

  if (expandedAssetsResponse.ok) {
    const html = await expandedAssetsResponse.text();
    const hrefMatches = Array.from(html.matchAll(/href="([^"]*\.exe)"/gi)).map(
      (entry) => entry[1]
    );
    const scopedLinks = hrefMatches.filter((link) => {
      const normalized = String(link || "");
      return normalized.includes(`/${OWNER}/${REPO}/releases/download/${versionTag}/`);
    });
    const uniqueLinks = Array.from(new Set(scopedLinks));

    const preferredLink =
      uniqueLinks.find((link) => /setup|installer/i.test(link)) || uniqueLinks[0] || "";
    downloadUrl = toAbsoluteGithubUrl(preferredLink);
  }

  if (!downloadUrl) {
    const candidateFileNames = [
      `Solidity.Playground-Installer-${versionLabel}.exe`,
      `Solidity Playground-Installer-${versionLabel}.exe`,
      `Solidity Playground-Setup-${versionLabel}.exe`,
      `Solidity.Playground.Setup.${versionLabel}.exe`,
    ];

    for (const fileName of candidateFileNames) {
      const candidate = `https://github.com/${OWNER}/${REPO}/releases/download/${encodeURIComponent(versionTag)}/${encodeURIComponent(fileName)}`;
      const probe = await fetch(candidate, {
        method: "HEAD",
        redirect: "manual",
        next: { revalidate: CACHE_SECONDS },
      });

      if (probe.ok || probe.status === 301 || probe.status === 302 || probe.status === 303) {
        downloadUrl = candidate;
        break;
      }
    }
  }

  return {
    versionTag,
    versionLabel,
    downloadUrl,
    releaseUrl,
  };
}

export async function GET() {
  let payload = buildEmptyRelease();

  try {
    payload = await fetchFromGithubApi();
  } catch (_) {
    try {
      const redirectPayload = await resolveViaLatestReleaseRedirect();
      if (redirectPayload) {
        payload = redirectPayload;
      }
    } catch (_) {
      payload = buildEmptyRelease();
    }
  }

  const cacheSeconds = payload.downloadUrl ? CACHE_SECONDS : 300;

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": `public, s-maxage=${cacheSeconds}, stale-while-revalidate=604800`,
    },
  });
}
