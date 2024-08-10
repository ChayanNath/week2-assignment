const fs = require("fs").promises;
const path = require("path");

// Promisified setTimeout
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Promisified readFile
async function readFileAsync(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data) || [];
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    console.error("Error reading file:", error);
    throw error;
  }
}

// Promisified writeFile
async function writeFileAsync(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
    console.log(`Data successfully written to ${filePath}`);
  } catch (error) {
    console.error("Error writing file:", error);
    throw error;
  }
}

async function fetchAndStoreData() {
  try {
    const config = await readFileAsync(path.resolve(__dirname, "config.json"));
    const { apiUrl, fetchInterval, outputPath } = config;
    console.log("Configuration loaded:", config);

    while (true) {
      console.log("Fetching Bitcoin price from API:", apiUrl);
      const response = await fetch(apiUrl);
      const data = await response.json();

      const currentISTTime = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: false,
      });

      const priceData = {
        time: data.time.updated,
        bitcoinPriceUSD: data.bpi.USD.rate_float,
        fetchedAt: currentISTTime,
      };

      let existingData = await readFileAsync(
        path.resolve(__dirname, outputPath)
      );

      if (!Array.isArray(existingData)) {
        existingData = [];
      }

      existingData.push(priceData);

      await writeFileAsync(path.resolve(__dirname, outputPath), existingData);

      console.log(
        `Waiting for ${fetchInterval / 1000} seconds before the next fetch...`
      );
      await delay(fetchInterval);
    }
  } catch (error) {
    console.error("Error in fetching and storing data:", error);
  }
}

fetchAndStoreData();
