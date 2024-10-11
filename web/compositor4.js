/**
 * Class representing a compositor node.
 * This class handles the logic for the compositor4 node, including configuration and setup.
 */
class Compositor4 {
  /**
   * Creates an instance of Compositor4.
   * @param {Object} config - Object containing configuration properties.
   * The object should include the following properties:
   * - width {number}
   * - height {number}
   * - padding {number}
   * - seed {number}
   * - onConfigChanged {string}
   * - isConfigChanged {boolean}
   * - preset {string} (a JSON string)
   * - images {string[]} (array of base64 images)
   */
  constructor(config) {
    this.preferences = {
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

    this.toolbarButtons = []; // Track added buttons

    // Register event listeners
    ["executed", "init"].forEach((eventType) => {
      document.addEventListener(eventType, (event) => this.setup(event.detail));
    });

    document.addEventListener("replace", (event) => {
      this.replaceImages(event.detail.newImages);
    });
  }

  /**
   * Parses the configuration and sets up the instance variables.
   * @param {Object} config - Configuration object.
   */
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

  /**
   * Fetches preferences and sets them into the class variable.
   */
  fetchPreferences() {
    // Simulate fetching preferences (e.g., from a server or local storage)
    const fetchedPreferences = {
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
      erosColor: "red", // Add eros color preference
      
      buttonSpacing: 10, // Spacing between buttons
      activeBorderColor: "red", // Border color when button is active
    };

    this.preferences = fetchedPreferences;
  }

  /**
   * Creates a canvas element and initializes fabric.js on it.
   */
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

  /**
   * Creates a rectangle representing the composition and adds it to the fabric canvas.
   */
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
    //this.fabricCanvas.renderAll();
  }

  /**
   * Draws a composition overlay rectangle with a green border and transparent background on top of the composition rectangle.
   */
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
    //this.fabricCanvas.renderAll();
  }

  /**
   * Sets up the canvas and draws the composition rectangle and overlay.
   */
  setup(config) {
    this.setupConfig(config);
    this.fetchPreferences();
    this.createCanvas();
    this.createCompositionRectangle();
    this.drawCompositionOverlay();
    if (!this.images.length) this.createImages();
    this.setupImages();
    this.createToolbar();
    this.bringToFront();
  }

  /**
   * Loops over the base64 images in the instance and adds them to the fabric canvas.
   * Initially, the images will be put at padding, padding.
   */
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
          //this.fabricCanvas.renderAll();
        },
        { crossOrigin: "anonymous" }
      );
    });
  }

  /**
   * Normalizes the image height to a percentage of the canvas height.
   * The width of the input image is scaled preserving the initial ratio.
   * @param {fabric.Image} img - The fabric image object to be resized.
   * @param {number} percentage - The percentage of the canvas height to normalize to.
   */
  normalizeHeight(img, percentage) {
    const scaleFactor = (this.height * percentage) / img.height;
    img.scale(scaleFactor);
  }

  /**
   * add a method that create 5 base 64 images each should have a different color and a number in the center (from 1 to 5),
   * the images should have different width and height at most 30% of the composition width and height
   */
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

  /**
   * Creates a toolbar in the canvas.
   */
  createToolbar() {
    const { fill, height, position } = this.preferences.toolbar;
    const toolbar = new fabric.Rect({
      left: position.left,
      top: position.top,
      width: this.fabricCanvas.width,
      height: height,
      fill: fill, // Use preferences for toolbar fill color
      selectable: false,
      evented: false,
    });

    this.fabricCanvas.add(toolbar);

    // Add buttons to the toolbar
    this.addExportButton();
    this.addBullseyeButton();

    // Layout the buttons
    //this.layoutToolbarButtons();

  }

  /**
   * Adds an export button to the toolbar.
   */
  addExportButton() {
    const exportIconSVG = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" fill="#ccc" stroke-width="2"/>
            <path d="M5 20H19V18H5V20ZM12 2V16M12 16L8 12M12 16L16 12" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;

    fabric.loadSVGFromString(exportIconSVG, (objects, options) => {
        const exportIcon = fabric.util.groupSVGElements(objects, options);
        exportIcon.set({
            left:10,
            top:10,
            selectable: false,
            evented: true,
            hoverCursor: "pointer",
            ignoreTransparentPixels: false, // Add ignoreTransparentPixels property to the button
        });

        // Function to set fill color for all paths in the SVG
        const setFillColor = (color) => {
            objects.forEach((obj) => {
                obj.set('stroke', color);
            });
        };

        // Add hover effect
        exportIcon.on('mouseover', () => {
            console.log('Mouse over export icon');
            setFillColor(this.preferences.erosColor);
            this.fabricCanvas.renderAll();
        });

        exportIcon.on('mouseout', () => {
            setFillColor('black');
            this.fabricCanvas.renderAll();
        });

        exportIcon.on('mousedown', () => {
            console.log('Exporting image...');
            const base64Image = this.exportAsBase64();
            this.downloadFile(base64Image, `${this.seed}.png`);
        });

        this.fabricCanvas.add(exportIcon);
        this.toolbarButtons.push(exportIcon); // Track the button
        this.fabricCanvas.bringToFront(exportIcon);
    });
  }

  /**
   * Adds a bullseye button to the toolbar.
   */
  addBullseyeButton() {
    const bullseyeIconSVG = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" fill="#ccc" stroke-width="2"/>
            <circle cx="12" cy="12" r="10" stroke="black" stroke-width="2"/>
            <circle cx="12" cy="12" r="6" stroke="black" stroke-width="2"/>
            <circle cx="12" cy="12" r="2" stroke="black" stroke-width="2"/>
        </svg>
    `;

    fabric.loadSVGFromString(bullseyeIconSVG, (objects, options) => {
        const bullseyeIcon = fabric.util.groupSVGElements(objects, options);
        
        bullseyeIcon.set({
            left:44,
            top:10,
            selectable: false,
            evented: true,
            hoverCursor: "pointer",
            ignoreTransparentPixels: false, // Add ignoreTransparentPixels property to the button
        });

        

        const updateToggleState = () => {
            console.log('updateToggleState');
            const strokeColor = this.fabricCanvas.ignoreTransparentPixels ? this.preferences.activeBorderColor : this.preferences.erosColor
            bullseyeIcon.set('stroke', strokeColor);
            this.fabricCanvas.renderAll();
        };

        bullseyeIcon.on('mousedown', () => {
            this.fabricCanvas.ignoreTransparentPixels = !this.fabricCanvas.ignoreTransparentPixels;                        
            updateToggleState();
        });

        this.fabricCanvas.add(bullseyeIcon);
        this.toolbarButtons.push(bullseyeIcon); // Track the button
        this.fabricCanvas.bringToFront(bullseyeIcon);
    });
  }

  /**
   * Layouts the buttons in the toolbar.
   */
  layoutToolbarButtons() {
    const spacing = this.preferences.buttonSpacing;
    this.toolbarButtons.forEach((button, index) => {
      button.set({
        left: 10 + (index * (24 + spacing)),
        top: 10,
      });
    });
    this.fabricCanvas.renderAll();
  }

  bringToFront() {
    this.fabricCanvas.bringToFront(this.compositionOverlay);
    this.fabricCanvas.bringToFront(this.toolbar);
    this.toolbarButtons.forEach((button)=>this.fabricCanvas.bringToFront(button));
    this.fabricCanvas.renderAll();
  }

  /**
   * Downloads a file with the given content and filename.
   * @param {string} content - The content of the file.
   * @param {string} filename - The name of the file.
   */
  downloadFile(content, filename) {
    const link = document.createElement("a");
    link.href = content;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Exports the canvas content as a base64 image.
   * @returns {string} - The base64 representation of the canvas content.
   */
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

  /**
   * Exports the canvas state as JSON, excluding the base64 image content.
   * @returns {Object} - The JSON representation of the canvas state.
   */
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

  /**
   * Replaces the images in the instance with new images and redraws them on the canvas.
   * @param {string[]} newImages - Array of new base64 images.
   */
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
