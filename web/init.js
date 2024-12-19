import Compositor4 from "./compositor4.js";

class Init {
  async initEditor(container, preferences,_config,_images) {
    console.log("initEditor", container, preferences,_config,_images);
    // const query = 'cats'; // Change this to your desired search query
    const query = "matisse"; // Change this to your desired search query
    try {
        
      //const images = await this.fetchArtInstituteImages(query, 6);
      const images = _images;
    
      const config = JSON.stringify({
        width: _config.width[0],
        height: _config.height[0],
        padding: _config.padding[0],
        seed: "1234",
        onConfigChanged: _config.onConfigChanged[0],
        isConfigChanged: _config.configChanged[0],
        preset: "{}",
        images: _images,
      });
      //  const config = JSON.stringify(_config);

      // const container = document.createElement("div");
      // container.id = "compositor4";
      const compositor = new Compositor4(container, config, preferences);
      compositor.setup(config)
      // trigger the executed event
      // const event = new CustomEvent("executed", { detail: config });
      // document.dispatchEvent(event);

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
