class Compositor4 {
  constructor(config) {
    this.preferences = this.getPreferences();

    // Register event listeners
    ["executed", "init"].forEach((eventType) => {
      document.addEventListener(eventType, (event) => this.setup(event.detail));
    });

    document.addEventListener("replace", (event) => {
      this.replaceImages(event.detail.newImages);
    });
  }

  setupConfig(config) {
    const parsedConfig = JSON.parse(config);
    this.width = parsedConfig.width;
    this.height = parsedConfig.height;
    this.padding = parsedConfig.padding;
    this.seed = parsedConfig.seed;
    this.onConfigChanged = parsedConfig.onConfigChanged;
    this.isConfigChanged = parsedConfig.isConfigChanged;
    this.preset = JSON.parse(parsedConfig.preset);
    this.images = parsedConfig.images || [];
  }

  getPreferences() {
    return {
      composition: {
        fill: "#696969", // Dark gray color for the rectangle
        stroke: "green", // Green border
        strokeWidth: 1,
      },
      toolbar: {
        fill: "white", // Dark gray color for the toolbar background
        height: 40,
        position: { left: 0, top: 0 },
      },
      fabricCanvas: {
        backgroundColor: "#A9A9A9", // Darker gray color for the canvas background
      },
      erosColor: "magenta", // Add eros color preference
      buttonSpacing: 10, // Spacing between buttons
      activeBorderColor: "magenta", // Border color when button is active
    };
  }

  createCanvas() {
    const canvas = document.createElement("canvas");
    canvas.id = "fcanvas";
    canvas.width = this.width + this.padding * 2;
    canvas.height = this.height + this.padding * 2;
    document.body.appendChild(canvas);

    this.fabricCanvas = new fabric.Canvas(canvas.id, {
      width: this.width + this.padding * 2,
      height: this.height + this.padding * 2,
      backgroundColor: this.preferences.fabricCanvas.backgroundColor, // Use preferences for canvas background color
      preserveObjectStacking: true,
    });
  }

  createCompositionRectangle() {
    this.compositionRectangle = new fabric.Rect({
      left: this.padding,
      top: this.padding,
      fill: this.preferences.composition.fill, // Use preferences for fill color
      width: this.width,
      height: this.height,
      selectable: false, // Make the rectangle non-interactive
      evented: false, // Ensure it is always on top and not interactive
    });

    this.fabricCanvas.add(this.compositionRectangle);
  }

  drawCompositionOverlay() {
    this.compositionOverlay = new fabric.Rect({
      left: this.padding - 1,
      top: this.padding - 1,
      width: this.width + 2,
      height: this.height + 2,
      fill: "transparent", // Transparent background
      stroke: this.preferences.composition.stroke, // Use preferences for stroke color
      strokeWidth: this.preferences.composition.strokeWidth, // Use preferences for stroke width
      selectable: false, // Make the overlay non-interactive
      evented: false, // Ensure it is always on top and not interactive
    });

    this.fabricCanvas.add(this.compositionOverlay);
    this.fabricCanvas.bringToFront(this.compositionOverlay);
  }

  setup(config) {
    this.setupConfig(config);
    this.createCanvas();
    this.createCompositionRectangle();
    this.drawCompositionOverlay();
    if (!this.images.length) this.createImages();
    this.setupImages();
    this.toolbar = new Toolbar(this.fabricCanvas, this.preferences);
    this.addToolbarButtons();
    this.bringToFront();
  }

  setupImages() {
    this.images.forEach((b64Image) => {
      fabric.Image.fromURL(
        b64Image,
        (img) => {
          img.set({
            left: this.padding,
            top: this.padding,
            crossOrigin: "anonymous", // Set crossOrigin attribute
          });

          this.normalizeHeight(img, 0.3); // Normalize height to 30% of canvas height
          this.fabricCanvas.add(img);
        },
        { crossOrigin: "anonymous" }
      );
    });
  }

  normalizeHeight(img, percentage) {
    const scaleFactor = (this.height * percentage) / img.height;
    img.scale(scaleFactor);
  }

  createImages() {
    const colors = ["#FFB3BA", "#B3FFB3", "#BAE1FF", "#FFFFBA", "#FFDFBA"];
    const numbers = ["1", "2", "3", "4", "5"];

    colors.forEach((color, index) => {
      const number = numbers[index];
      const width = (Math.random() * 0.2 + 0.1) * this.width;
      const height = (Math.random() * 0.2 + 0.1) * this.height;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "black";
      ctx.font = "30px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(number, width / 2, height / 2);

      const img = new Image();
      img.src = canvas.toDataURL();
      img.onload = () => {
        const fabricImg = new fabric.Image(img);
        this.normalizeHeight(fabricImg, 0.3); // Normalize height to 30% of canvas height
        this.images.push(fabricImg.toDataURL());
      };
    });
  }

  addToolbarButtons() {
    this.toolbar.addExportButton(this);
    this.toolbar.addBullseyeButton(this);
    this.toolbar.addSavePresetButton(this);
    this.toolbar.addLoadPresetButton(this);
    this.toolbar.layoutToolbarButtons();
  }

  bringToFront() {
    this.fabricCanvas.bringToFront(this.compositionOverlay);
    this.toolbar.bringToFront();
  }

  downloadFile(content, filename) {
    let link = document.createElement("a");

    if (filename.endsWith(".json")) {
      // Handle JSON content
      const blob = new Blob([content], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up the URL object
    } else if (filename.endsWith(".png")) {
      // Handle base64 image content
      link.href = content;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error("Unsupported file type");
    }
  }

  exportAsBase64() {
    return this.fabricCanvas.toDataURL({
      format: "png",
      quality: 1.0,
      left: this.padding,
      top: this.padding,
      width: this.width,
      height: this.height,
    });
  }

  exportAsJSON() {
    const objects = this.fabricCanvas.getObjects().map((obj) => {
      if (obj.type === "image") {
        return {
          type: obj.type,
          width: obj.width,
          height: obj.height,
          skewX: obj.skewX,
          skewY: obj.skewY,
          angle: obj.angle,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          left: obj.left,
          top: obj.top,
          originX: obj.originX,
          originY: obj.originY,
        };
      } else {
        return obj.toObject();
      }
    });

    return {
      objects: objects,
      background: this.fabricCanvas.backgroundColor,
    };
  }

  replaceImages(newImages) {
    // Clear existing images from the canvas
    this.fabricCanvas.getObjects("image").forEach((img) => {
      this.fabricCanvas.remove(img);
    });

    // Update the images in the instance
    this.images = newImages;

    // Redraw the new images on the canvas
    this.setupImages();
  }
}