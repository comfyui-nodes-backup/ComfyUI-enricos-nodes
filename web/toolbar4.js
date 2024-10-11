
const LOAD_ICON_SVG = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="magenta" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 8V16M12 8L8 12M12 8L16 12" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

const HEART_ICON_SVG = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="red"/>
  </svg>
`;

const EXPORT_ICON_SVG = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" fill="#ccc" stroke-width="2"/>
    <path d="M5 20H19V18H5V20ZM12 2V16M12 16L8 12M12 16L16 12" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

const BULLSEYE_ICON_SVG = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" fill="#ccc" stroke-width="2"/>
    <circle cx="12" cy="12" r="10" stroke="black" stroke-width="2"/>
    <circle cx="12" cy="12" r="6" stroke="black" stroke-width="2"/>
    <circle cx="12" cy="12" r="2" stroke="black" stroke-width="2"/>
  </svg>
`;

class Toolbar {
  constructor(fabricCanvas, preferences) {
    this.fabricCanvas = fabricCanvas;
    this.preferences = preferences;
    this.toolbarButtons = [];
    this.createToolbar();
  }

  createToolbar() {
    const { fill, height, position } = this.preferences.toolbar;
    this.toolbar = new fabric.Rect({
      left: position.left,
      top: position.top,
      width: this.fabricCanvas.width,
      height: height,
      fill: fill, // Use preferences for toolbar fill color
      selectable: false,
      evented: false,
    });

    this.fabricCanvas.add(this.toolbar);
  }

  addToolbarButton(svgContent, onClick) {
    fabric.loadSVGFromString(svgContent, (objects, options) => {
      const buttonIcon = fabric.util.groupSVGElements(objects, options);
      this.toolbarButtons.push(buttonIcon); // Track the button
      const index = this.toolbarButtons.length - 1;
      const spacing = this.preferences.buttonSpacing;
      buttonIcon.set({
        left: 10 + index * (24 + spacing),
        top: 10,
        selectable: false,
        evented: true,
        hoverCursor: "pointer",
        ignoreTransparentPixels: false, // Add ignoreTransparentPixels property to the button
      });

      buttonIcon.on("mousedown", onClick);

      this.fabricCanvas.add(buttonIcon);
      this.fabricCanvas.bringToFront(buttonIcon);
    });
  }

  layoutToolbarButtons() {
    const spacing = this.preferences.buttonSpacing;
    this.toolbarButtons.forEach((button, index) => {
      button.set({
        left: 10 + index * (24 + spacing),
        top: 10,
      });
    });
    this.fabricCanvas.renderAll();
  }

  bringToFront() {
    this.fabricCanvas.bringToFront(this.toolbar);
    this.toolbarButtons.forEach((button) => this.fabricCanvas.bringToFront(button));
    this.fabricCanvas.renderAll();
  }

  addLoadPresetButton(compositor) {
    const onClick = () => {
      console.log("Loading preset...");
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json";
      input.onchange = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          const preset = JSON.parse(e.target.result);
          compositor.loadPreset(preset);
        };
        reader.readAsText(file);
      };
      input.click();
    };

    this.addToolbarButton(LOAD_ICON_SVG, onClick);
  }

  addSavePresetButton(compositor) {
    const onClick = () => {
      console.log("Saving preset...");
      const config = {
        width: compositor.width,
        height: compositor.height,
        padding: compositor.padding,
        seed: compositor.seed,
        onConfigChanged: compositor.onConfigChanged,
        isConfigChanged: compositor.isConfigChanged,
        preset: JSON.stringify(compositor.preset),
        images: compositor.images,
      };
      const preset = {
        config: config,
        canvasState: compositor.fabricCanvas.toJSON(),
      };
      console.log(preset);
      compositor.downloadFile(JSON.stringify(preset), "preset.json");
    };

    this.addToolbarButton(HEART_ICON_SVG, onClick);
  }

  addExportButton(compositor) {
    const onClick = () => {
      console.log("Exporting image...");
      const base64Image = compositor.exportAsBase64();
      compositor.downloadFile(base64Image, `${compositor.seed}.png`);
    };

    this.addToolbarButton(EXPORT_ICON_SVG, onClick);
  }

  addBullseyeButton(compositor) {
    const onClick = () => {
      compositor.fabricCanvas.ignoreTransparentPixels = !compositor.fabricCanvas.ignoreTransparentPixels;
      const strokeColor = compositor.fabricCanvas.ignoreTransparentPixels ? compositor.preferences.activeBorderColor : compositor.preferences.erosColor;
      compositor.fabricCanvas.renderAll();
    };

    this.addToolbarButton(BULLSEYE_ICON_SVG, onClick);
  }
}