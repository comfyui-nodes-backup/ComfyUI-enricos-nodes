const ICON_URLS = {
  loadPreset: "https://icons.getbootstrap.com/assets/icons/file-earmark-arrow-up.svg",
  savePreset: "https://icons.getbootstrap.com/assets/icons/heart.svg",
  export: "https://icons.getbootstrap.com/assets/icons/file-earmark-arrow-down.svg",
  bullseye: "https://icons.getbootstrap.com/assets/icons/crosshair.svg",
  alignVertical: "https://icons.getbootstrap.com/assets/icons/border-middle.svg", // Icon for vertical centering
  alignHorizontal: "https://icons.getbootstrap.com/assets/icons/border-center.svg", // Icon for horizontal centering
  alignBoth: "https://icons.getbootstrap.com/assets/icons/border-inner.svg", // Icon for both horizontal and vertical centering
  snapToPixel: "https://icons.getbootstrap.com/assets/icons/magnet.svg", // Icon for snap to pixel
};
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

    this.fabricCanvas.on("before:selection:cleared", (event) => {
      this.lastSelection = event.target;
    });
  }

  async addToolbarButton(iconUrl, onClick) {
    try {
      const svgContent = await fetchSVGIcon(iconUrl);
      fabric.loadSVGFromString(svgContent, (objects, options) => {
        const buttonIcon = fabric.util.groupSVGElements(objects, options);
        this.toolbarButtons.push(buttonIcon); // Track the button
        const index = this.toolbarButtons.length - 1;
        const spacing = this.preferences.toolbar.buttonSpacing;
        const iconSize = this.preferences.toolbar.iconSize;
        buttonIcon.set({
          left: 10 + index * (iconSize + spacing),
          top: 7,
          scaleX: iconSize / 24,
          scaleY: iconSize / 24,
          selectable: false,
          evented: true,
          hoverCursor: "pointer",
          ignoreTransparentPixels: false, // Add ignoreTransparentPixels property to the button
        });

        buttonIcon.on("mousedown", onClick);

        this.fabricCanvas.add(buttonIcon);
        this.fabricCanvas.bringToFront(buttonIcon);
      });
    } catch (error) {
      console.error(error);
    }
  }

  layoutToolbarButtons() {
    const spacing = this.preferences.toolbar.buttonSpacing;
    const iconSize = this.preferences.toolbar.iconSize;
    this.toolbarButtons.forEach((button, index) => {
      button.set({
        left: 10 + index * (iconSize + spacing),
        top: 2,
      });
    });
    this.fabricCanvas.renderAll();
  }

  bringToFront() {
    this.fabricCanvas.bringToFront(this.toolbar);
    this.toolbarButtons.forEach((button) => this.fabricCanvas.bringToFront(button));
    this.fabricCanvas.renderAll();
  }

  async addLoadPresetButton(compositor) {
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

    await this.addToolbarButton(ICON_URLS.loadPreset, onClick);
  }

  async addSavePresetButton(compositor) {
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

    await this.addToolbarButton(ICON_URLS.savePreset, onClick);
  }

  async addExportButton(compositor) {
    const onClick = () => {
      console.log("Exporting image...");
      const base64Image = compositor.exportAsBase64();
      compositor.downloadFile(base64Image, `${compositor.seed}.png`);
    };

    await this.addToolbarButton(ICON_URLS.export, onClick);
  }

  async addBullseyeButton(compositor) {
    const onClick = () => {
      compositor.fabricCanvas.ignoreTransparentPixels = !compositor.fabricCanvas.ignoreTransparentPixels;
      const strokeColor = compositor.fabricCanvas.ignoreTransparentPixels ? compositor.preferences.activeBorderColor : compositor.preferences.erosColor;
      compositor.fabricCanvas.renderAll();
    };

    await this.addToolbarButton(ICON_URLS.bullseye, onClick);
  }

  async addAlignVerticalButton() {
    const onClick = (event) => {
      this.alignSelectedObjectsVertically();
    };

    await this.addToolbarButton(ICON_URLS.alignVertical, onClick);
  }

  async addAlignHorizontalButton() {
    const onClick = (event) => {
      this.alignSelectedObjectsHorizontally();
    };

    await this.addToolbarButton(ICON_URLS.alignHorizontal, onClick);
  }

  async addAlignBothButton() {
    const onClick = (event) => {
      this.alignSelectedObjectsBoth();
    };

    await this.addToolbarButton(ICON_URLS.alignBoth, onClick);
  }

  alignSelectedObjectsVertically() {
    const selection = this.fabricCanvas.getActiveObject() ?? this.lastSelection;
    if (selection) {
      const objects = selection.getObjects();
      const centerX = selection.getCenterPoint().x;
      objects.forEach((obj) => {
        obj.set({
          left: centerX - obj.getScaledWidth() / 2,
        });
        obj.setCoords();
      });
      this.fabricCanvas.renderAll();
    }
  }

  alignSelectedObjectsHorizontally() {
    const selection = this.fabricCanvas.getActiveObject() ?? this.lastSelection;
    if (selection) {
      const objects = selection.getObjects();
      const centerY = selection.getCenterPoint().y;
      objects.forEach((obj) => {
        obj.set({
          top: centerY - obj.getScaledHeight() / 2,
        });
        obj.setCoords();
      });
      this.fabricCanvas.renderAll();
    }
  }

  alignSelectedObjectsBoth() {
    const selection = this.fabricCanvas.getActiveObject() ?? this.lastSelection;
    if (selection) {
      const objects = selection.getObjects();
      const centerX = selection.getCenterPoint().x;
      const centerY = selection.getCenterPoint().y;
      objects.forEach((obj) => {
        obj.set({
          left: centerX - obj.getScaledWidth() / 2,
          top: centerY - obj.getScaledHeight() / 2,
        });
        obj.setCoords();
      });
      this.fabricCanvas.renderAll();
    }
  }

  // add a method to reset the lastSelection property
  resetLastSelection() {
    this.lastSelection = null;
  }

  // add a methods that sets a preference called snap to pixel and a button that toggles it with a magnet icon
    async addSnapToPixelButton() {
        const onClick = () => {
        this.preferences.snapToPixel = !this.preferences.snapToPixel;
        this.fabricCanvas.renderAll();
        };
    
        await this.addToolbarButton(ICON_URLS.snapToPixel, onClick);
    }
}

async function fetchSVGIcon(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch SVG icon from ${url}`);
  }
  return await response.text();
}
