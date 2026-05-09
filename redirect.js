(async () => {
  const CHANNEL = "LIVE";
  const CLIENT_VERSION_BASE =
    "https://clientsettings.roblox.com/v2/client-version";
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

  try {
    const platform = await getPlatform();
    const binaryType = getBinaryType(platform);

    if (!binaryType) {
      setStatus("RDD redirect is only available on Windows and macOS.");
      return;
    }

    const versionUrl = `${CLIENT_VERSION_BASE}/${binaryType}/channel/${CHANNEL}`;
    const response = await fetch(versionUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Version lookup failed with status ${response.status}`);
    }

    const data = await response.json();
    const version = data.clientVersionUpload;

    if (!version) {
      throw new Error("clientVersionUpload was missing from the response");
    }

    const target = new URL(REDIRECT_BASE);
    target.searchParams.set("channel", CHANNEL);
    target.searchParams.set("binaryType", binaryType);
    target.searchParams.set("version", version);

    window.location.replace(target.toString());
  } catch (error) {
    console.error(error);
    setStatus("Could not redirect to RDD. Please try again later.");
  }
})();
