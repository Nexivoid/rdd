(async () => {
  const CHANNEL = "LIVE";
  const CLIENT_VERSION_BASES = [
    "https://clientsettingscdn.roblox.com/v2/client-version",
    "https://clientsettings.roblox.com/v2/client-version",
  ];
  const REDIRECT_BASE = "https://rdd.latte.to/";
  const VERSION_LOOKUP_TIMEOUT_MS = 2000;
  const status = document.getElementById("status");
  const fallback = document.getElementById("fallback");

  function setStatus(message) {
    if (status) {
      status.textContent = message;
    }
  }

  function setFallback(url, isVisible = false) {
    if (!fallback) {
      return;
    }

    fallback.href = url;
    fallback.hidden = !isVisible;
  }

  async function getPlatform() {
    const platformSignals = [
      navigator.platform,
      navigator.userAgent,
      navigator.vendor,
    ];
    const userAgentData = navigator.userAgentData;

    if (userAgentData?.platform) {
      platformSignals.unshift(userAgentData.platform);
    }

    if (userAgentData?.getHighEntropyValues) {
      try {
        const { platform } = await userAgentData.getHighEntropyValues([
          "platform",
        ]);
        platformSignals.unshift(platform);
      } catch {
        
      }
    }

    return platformSignals.filter(Boolean).join(" ");
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
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, VERSION_LOOKUP_TIMEOUT_MS);

      try {
        const versionUrl = `${baseUrl}/${binaryType}/channel/${CHANNEL}`;
        const response = await fetch(versionUrl, { signal: controller.signal });

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
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError;
  }

  try {
    setFallback(REDIRECT_BASE);
    setStatus("Reading your platform...");

    const platform = await getPlatform();
    const binaryType = getBinaryType(platform);

    if (!binaryType) {
      setStatus("RDD redirect is only available on Windows and macOS.");
      setFallback(REDIRECT_BASE, true);
      return;
    }

    setFallback(makeRedirectUrl(binaryType));
    setStatus("Finding the latest Roblox build...");

    try {
      const version = await fetchVersion(binaryType);
      const redirectUrl = makeRedirectUrl(binaryType, version);

      setFallback(redirectUrl);
      setStatus("Launching RDD...");
      window.location.replace(redirectUrl);
    } catch (error) {
      console.warn("Version lookup failed; redirecting to RDD latest.", error);
      const redirectUrl = makeRedirectUrl(binaryType);

      setFallback(redirectUrl);
      setStatus("Launching RDD latest...");
      window.location.replace(redirectUrl);
    }
  } catch (error) {
    console.error(error);
    setStatus("Could not redirect to RDD. Please try again later.");
    setFallback(REDIRECT_BASE, true);
  }
})();
