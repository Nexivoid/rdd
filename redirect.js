(async () => {
  const CHANNEL = "LIVE";
  const CLIENT_VERSION_BASES = [
    "https://clientsettingscdn.roblox.com/v2/client-version",
    "https://clientsettings.roblox.com/v2/client-version",
  ];
  const REDIRECT_BASE = "https://rdd.latte.to/";
  const status = document.getElementById("status");

  function setStatus(message) {
    if (status) {
      status.textContent = message;
    }
  }

  async function getPlatform() {
    const userAgentData = navigator.userAgentData;

    if (userAgentData?.platform) {
      return userAgentData.platform;
    }

    if (userAgentData?.getHighEntropyValues) {
      try {
        const { platform } = await userAgentData.getHighEntropyValues([
          "platform",
        ]);
        return platform;
      } catch {
        // Fall back to the classic user agent checks below.
      }
    }

    return navigator.platform || navigator.userAgent || "";
  }

  function getBinaryType(platform) {
    const normalized = platform.toLowerCase();

    if (normalized.includes("win")) {
      return "WindowsPlayer";
    }

    if (normalized.includes("mac")) {
      return "MacPlayer";
    }

    return null;
  }

  function makeRedirectUrl(binaryType, version) {
    const target = new URL(REDIRECT_BASE);
    target.searchParams.set("channel", CHANNEL);
    target.searchParams.set("binaryType", binaryType);

    if (version) {
      target.searchParams.set("version", version);
    }

    return target.toString();
  }

  async function fetchVersion(binaryType) {
    let lastError;

    for (const baseUrl of CLIENT_VERSION_BASES) {
      try {
        const versionUrl = `${baseUrl}/${binaryType}/channel/${CHANNEL}`;
        const response = await fetch(versionUrl, {
          cache: "no-store",
          referrerPolicy: "no-referrer",
        });

        if (!response.ok) {
          throw new Error(`Version lookup failed with status ${response.status}`);
        }

        const data = await response.json();
        const version = data.clientVersionUpload;

        if (!version) {
          throw new Error("clientVersionUpload was missing from the response");
        }

        return version;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  }

  try {
    const platform = await getPlatform();
    const binaryType = getBinaryType(platform);

    if (!binaryType) {
      setStatus("RDD redirect is only available on Windows and macOS.");
      return;
    }

    try {
      const version = await fetchVersion(binaryType);
      window.location.replace(makeRedirectUrl(binaryType, version));
    } catch (error) {
      console.warn("Version lookup failed; redirecting to RDD latest.", error);
      window.location.replace(makeRedirectUrl(binaryType));
    }
  } catch (error) {
    console.error(error);
    setStatus("Could not redirect to RDD. Please try again later.");
  }
})();
