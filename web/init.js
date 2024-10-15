import Compositor4 from "./compositor4.js";
import { fabric } from "./fabric.js";
class Init {
  async initEditor(container) {
    // const query = 'cats'; // Change this to your desired search query
    const query = "matisse"; // Change this to your desired search query
    try {
      const images = await this.fetchArtInstituteImages(query, 6);

      const PREFERENCES = {
        composition: {
          fill: "#444444", // Dark gray color for the rectangle
          stroke: "green", // Green border
          strokeWidth: 1,
        },
        toolbar: {
          fill: "#666666",
          height: 40,
          position: { left: 0, top: 0 },
          buttonSpacing: 4,
          iconSize: 40, // Set the icon size to 30
        },
        fabricCanvas: {
          backgroundColor: "#555555", // Darker gray color for the canvas background
        },
        equalizeHeight: {
          enabled: true,
        },
        snapToGrid: {
          gridSize: 20,
          enabled: false,
          isGridVisible: false,
        },
        ignoreTransparentPixels: {
          enabled: false,
        },
        erosColor: "magenta", // Add eros color preference
        activeBorderColor: "magenta", // Border color when button is active
        inactiveBorderColor: "black", // Border color when button is inactive
        toggledBorderColor: "orange", // Border color when button is toggled
      };

      const config = JSON.stringify({
        width: 800,
        height: 600,
        padding: 100,
        seed: 12345,
        onConfigChanged: "configChanged",
        isConfigChanged: false,
        preset: "{}",
        images: images,
      });
      // const container = document.createElement("div");
      // container.id = "compositor4";
      const compositor = new Compositor4(container, config, PREFERENCES);
      // trigger the executed event
      const event = new CustomEvent("executed", { detail: config });
      document.dispatchEvent(event);

      return compositor;
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  }

  async fetchArtInstituteImages(query, count) {
    const searchUrl = `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    const data = await response.json();
    const artworks = data.data.slice(0, count);

    const imageUrls = await Promise.all(
      artworks.map(async (artwork) => {
        const artworkResponse = await fetch(artwork.api_link);
        if (!artworkResponse.ok) {
          console.warn(`Failed to fetch artwork details for ${artwork.id}: ${artworkResponse.statusText}`);
          return null;
        }
        const artworkData = await artworkResponse.json();
        const imageId = artworkData.data.image_id;
        if (!imageId) {
          console.warn(`No image_id found for artwork: ${artwork.id}`);
          return null;
        }
        return `https://www.artic.edu/iiif/2/${imageId}/full/843,/0/default.jpg`;
      })
    );

    return imageUrls.filter((url) => url !== null);
  }
}

export default Init;
