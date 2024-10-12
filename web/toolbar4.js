const ICON_URLS = {
  loadPreset: "https://icons.getbootstrap.com/assets/icons/file-earmark-arrow-up.svg",
  savePreset: "https://icons.getbootstrap.com/assets/icons/file-earmark-arrow-down.svg",
  export: "https://icons.getbootstrap.com/assets/icons/camera.svg",
  bullseye: "https://icons.getbootstrap.com/assets/icons/crosshair.svg",
  alignVertical: "https://icons.getbootstrap.com/assets/icons/border-middle.svg", // Icon for vertical centering
  alignHorizontal: "https://icons.getbootstrap.com/assets/icons/border-center.svg", // Icon for horizontal centering
  alignBoth: "https://icons.getbootstrap.com/assets/icons/border-inner.svg", // Icon for both horizontal and vertical centering
  snapToPixel: "https://icons.getbootstrap.com/assets/icons/magnet.svg", // Icon for snap to pixel
  resetTransform: "https://icons.getbootstrap.com/assets/icons/arrow-counterclockwise.svg", // Icon for reset transformations
};

const BUTTON_INDICES = {
  export: 0,
  bullseye: 1,
  alignVertical: 2,
  alignHorizontal: 3,
  alignBoth: 4,
  snapToPixel: 5,
  loadPreset: 6,
  savePreset: 7,
  resetTransform: 8,
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
      excludeFromExport: true,
    });

    this.fabricCanvas.add(this.toolbar);

    this.fabricCanvas.on("before:selection:cleared", (event) => {
      this.lastSelection = event.target;
    });

    this.addSnapToPixelListeners();
  }

  async addToolbarButton(iconUrl, onClick, index, toggleable = false) {
    try {
      const svgContent = await fetchSVGIcon(iconUrl);
      fabric.loadSVGFromString(svgContent, (objects, options) => {
        const buttonIcon = fabric.util.groupSVGElements(objects, options);
        this.toolbarButtons[index] = buttonIcon; // Track the button
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
          excludeFromExport: true,
          toggled: false,
        });

        buttonIcon.on("mousedown", (e) => {
          toggleable ? buttonIcon.set("toggled", !buttonIcon.toggled) : () => {};
          objects.forEach((obj) => {
            obj.set("fill", toggleable && buttonIcon.toggled ? this.preferences.toggledBorderColor : this.preferences.inactiveBorderColor);
          });
          onClick(e);
        });
        buttonIcon.on("mouseout", () => {
          // Set the stroke of objects within the buttonIcon group to inactiveBorderColor
          if (buttonIcon.type === "group") {
            objects.forEach((obj) => {
              obj.set("fill", buttonIcon.toggled ? this.preferences.toggledBorderColor : this.preferences.inactiveBorderColor);
            });
          } else {
            buttonIcon.set("fill", buttonIcon.toggled ? this.preferences.toggledBorderColor : this.preferences.inactiveBorderColor);
          }
          this.fabricCanvas.renderAll();
        });
        buttonIcon.on("mouseover", () => {
          // Set the stroke of objects within the buttonIcon group to erosColor
          if (buttonIcon.type === "group") {
            objects.forEach((obj) => {
              obj.set("fill", this.preferences.erosColor);
            });
          } else {
            buttonIcon.set("fill", this.preferences.erosColor);
          }
          this.fabricCanvas.renderAll();
        });

        this.fabricCanvas.add(buttonIcon);
        this.fabricCanvas.bringToFront(buttonIcon);
        return buttonIcon;
      });
    } catch (error) {
      console.error(error);
    }
  }

  layoutToolbarButtons() {
    const spacing = this.preferences.toolbar.buttonSpacing;
    const iconSize = this.preferences.toolbar.iconSize;
    console.log(this.toolbarButtons);
    this.toolbarButtons.forEach((button, index) => {
      button.set({
        left: 10 + index * (iconSize + spacing),
        top: 2,
      });
    });
    this.fabricCanvas.renderAll();
  }

  bringToFront() {
    //debugger;
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
          compositor.restoreFromPreset(preset);
        };
        reader.readAsText(file);
      };
      input.click();
    };

    await this.addToolbarButton(ICON_URLS.loadPreset, onClick, BUTTON_INDICES.loadPreset);
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

    await this.addToolbarButton(ICON_URLS.savePreset, onClick, BUTTON_INDICES.savePreset);
  }

  async addExportButton(compositor) {
    const onClick = () => {
      console.log("Exporting image...");
      const base64Image = compositor.exportAsBase64();
      compositor.downloadFile(base64Image, `${compositor.seed}.png`);
    };

    await this.addToolbarButton(ICON_URLS.export, onClick, BUTTON_INDICES.export);
  }

  async addBullseyeButton(compositor) {
    const onClick = () => {
      // per pixel target find vs ignoreTransparentPixels
      compositor.fabricCanvas.perPixelTargetFind = !compositor.fabricCanvas.perPixelTargetFind;
      const strokeColor = compositor.fabricCanvas.perPixelTargetFind ? compositor.preferences.activeBorderColor : compositor.preferences.erosColor;
      compositor.fabricCanvas.renderAll();
    };

    await this.addToolbarButton(ICON_URLS.bullseye, onClick, BUTTON_INDICES.bullseye, true);
  }

  async addAlignVerticalButton() {
    const onClick = (event) => {
      this.alignSelectedObjectsVertically();
    };

    await this.addToolbarButton(ICON_URLS.alignVertical, onClick, BUTTON_INDICES.alignVertical);
  }

  async addAlignHorizontalButton() {
    const onClick = (event) => {
      this.alignSelectedObjectsHorizontally();
    };

    await this.addToolbarButton(ICON_URLS.alignHorizontal, onClick, BUTTON_INDICES.alignHorizontal);
  }

  async addAlignBothButton() {
    const onClick = (event) => {
      this.alignSelectedObjectsBoth();
    };

    await this.addToolbarButton(ICON_URLS.alignBoth, onClick, BUTTON_INDICES.alignBoth);
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

  addSnapToPixelListeners() {
    const gridSize = this.preferences.snapToGrid.gridSize || 1; // Default to 1px if not specified

    this.fabricCanvas.on("object:scaling", (e) => {
      if (this.preferences.snapToPixel) {
        const obj = e.target;
        obj.set({
          scaleX: Math.round(obj.scaleX * obj.width / gridSize) * gridSize / obj.width,
          scaleY: Math.round(obj.scaleY * obj.height / gridSize) * gridSize / obj.height,
        });
      }
    });

    this.fabricCanvas.on("object:moving", (e) => {
      if (this.preferences.snapToPixel) {
        const obj = e.target;
        obj.set({
          left: Math.round(obj.left / gridSize) * gridSize,
          top: Math.round(obj.top / gridSize) * gridSize,
        });
      }
    });
  }

  // add a method to reset the lastSelection property
  resetLastSelection() {
    this.lastSelection = null;
  }

  // add a methods that sets a preference called snap to pixel and a button that toggles it with a magnet icon
  async addSnapToPixelButton() {
    const onClick = () => {
      this.preferences.snapToPixel = !this.preferences.snapToPixel;
      this.toolbarButtons[BUTTON_INDICES.snapToPixel].set("toggled", this.preferences.snapToPixel ? true : false);
      this.fabricCanvas.renderAll();
    };

    await this.addToolbarButton(ICON_URLS.snapToPixel, onClick, BUTTON_INDICES.snapToPixel, true);
  }

  // add a method to add a reset transformations button
  async addResetTransformButton() {
    const onClick = () => {
     const selection = this.fabricCanvas.getActiveObject() ?? this.lastSelection;
      
      if (selection) {
        if (selection.type === 'activeSelection') {
            selection.forEachObject((obj) => {
            obj.set({
              scaleX: 1,
              scaleY: 1,
              angle: 0,
              left: obj.originalLeft || obj.left,
              top: obj.originalTop || obj.top,
            });
            obj.setCoords();
          });
        } else {
            selection.set({
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            left: selection.originalLeft || selection.left,
            top: selection.originalTop || selection.top,
          });
          selection.setCoords();
        }
        this.fabricCanvas.renderAll();
      }
    };

    await this.addToolbarButton(ICON_URLS.resetTransform, onClick, BUTTON_INDICES.resetTransform);
  }
}

async function fetchSVGIcon(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch SVG icon from ${url}`);
  }
  return await response.text();
}