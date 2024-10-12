class Compositor4 {
  constructor(config) {
    this.preferences = this.getPreferences();

    // Register event listeners
    ["executed", "init"].forEach((eventType) => {
      document.addEventListener(eventType, (event) => this.setup(event.detail));
    });

    // test event
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
      snapToGrid:{
        gridSize: 10,
      },
      erosColor: "magenta", // Add eros color preference
      activeBorderColor: "magenta", // Border color when button is active
      inactiveBorderColor: "black", // Border color when button is inactive
      toggledBorderColor: "green", // Border color when button is toggled
    };
  }

  createCanvas() {
    const canvas = document.createElement("canvas");
    canvas.id = "fcanvas";
    canvas.width = this.width + this.padding * 2;
    canvas.height = this.height + this.padding * 2;
    document.body.appendChild(canvas);

    this.fabricCanvas = new fabric.Canvas(canvas.id, {
      preserveObjectStacking: true,
      width: this.width + this.padding * 2,
      height: this.height + this.padding * 2,
      backgroundColor: this.preferences.fabricCanvas.backgroundColor, // Use preferences for canvas background color
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
      excludeFromExport: true, // Exclude the rectangle from export
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
      excludeFromExport: true, // Exclude the overlay from export
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

  // temp
  restore(config) {
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

  finishedCallback(data){
    console.log(data);
    this.bringToFront();
    
    this.toolbar = new Toolbar(this.fabricCanvas, this.preferences);
    this.addToolbarButtons();
    this.fabricCanvas.renderAll();
  }

  restoreFromPreset(preset) {
    // Clear existing objects from the canvas
    this.fabricCanvas.clear();
    this.fabricCanvas.renderAll();
    // setupConfig
    // createCanvas
    // Restore canvas background color
    this.fabricCanvas.backgroundColor = preset.background;
    this.fabricCanvas.renderAll();
    // Re-add composition rectangle and overlay
    this.createCompositionRectangle();
    this.fabricCanvas.renderAll();
    this.drawCompositionOverlay();
    this.fabricCanvas.renderAll();
    console.log(preset.canvasState);
    this.fabricCanvas.loadFromJSON(preset.canvasState, this.finishedCallback.bind(this));
    // Render the canvas
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
            preserveObjectStacking: true, // Preserve object stacking
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

  // testing only
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

    this.toolbar.addAlignVerticalButton(); // Align vertical button
    this.toolbar.addAlignHorizontalButton(); // Align horizontal button
    this.toolbar.addAlignBothButton(); // Align both button
    this.toolbar.addSnapToPixelButton(); // Snap to pixel button
    this.toolbar.addResetTransformButton(); // Reset transform button
    this.toolbar.layoutToolbarButtons();
  }

  bringToFront() {  
    this.toolbar.bringToFront();
    this.fabricCanvas.bringToFront(this.compositionOverlay);
    this.fabricCanvas.renderAll();
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
    const objects = this.fabricCanvas
      .getObjects()
      .filter((obj) => !obj.excludeFromExport)
      .map((obj) => {
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
