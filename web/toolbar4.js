

export const ICON_URLS = {
  loadPreset: "https://icons.getbootstrap.com/assets/icons/file-earmark-arrow-up.svg",
  savePreset: "https://icons.getbootstrap.com/assets/icons/file-earmark-arrow-down.svg",
  export: "https://icons.getbootstrap.com/assets/icons/camera.svg",
  bullseye: "https://icons.getbootstrap.com/assets/icons/crosshair.svg",
  alignVertical: "https://icons.getbootstrap.com/assets/icons/border-middle.svg", // Icon for vertical centering
  alignHorizontal: "https://icons.getbootstrap.com/assets/icons/border-center.svg", // Icon for horizontal centering
  alignBoth: "https://icons.getbootstrap.com/assets/icons/border-inner.svg", // Icon for both horizontal and vertical centering
  snapToGrid: "https://icons.getbootstrap.com/assets/icons/magnet.svg", // Icon for snap to pixel
  resetTransform: "https://icons.getbootstrap.com/assets/icons/arrow-counterclockwise.svg", // Icon for reset transformations
  advancedResetTransform: "https://icons.getbootstrap.com/assets/icons/arrow-repeat.svg", // Icon for advanced reset transformations
  equalizeHeight: "https://icons.getbootstrap.com/assets/icons/sliders2-vertical.svg", // Icon for equalize height
  toggleGrid: "https://icons.getbootstrap.com/assets/icons/border.svg", // Icon for toggle grid
};

export const BUTTON_INDICES = ["export", "loadPreset", "savePreset", "alignVertical", "alignHorizontal", "alignBoth", "resetTransform", "advancedResetTransform", "equalizeHeight", "snapToGrid", "toggleGrid", "bullseye"];

export class Toolbar {
  constructor(compositor) {
    this.fabricCanvas = compositor.fabricCanvas;
    this.preferences = compositor.preferences;
    this.compositionRectangle = compositor.compositionRectangle;
    this.compositor = compositor;
    this.toolbarButtons = [];
    this.createToolbar();
  }

  addToolbarButtons() {
    this.addExportButton();
    this.addSavePresetButton();
    this.addLoadPresetButton();
    this.addAlignVerticalButton(); // Align vertical button
    this.addAlignHorizontalButton(); // Align horizontal button
    this.addAlignBothButton(); // Align both button
    this.addResetTransformButton(); // Reset transform button
    this.addAdvancedResetTransformButton(); // Reset transform button
    this.addEqualizeHeightButton(); // Equalize height button    
    this.addToggleGridButton(); // Toggle grid button
    this.addsnapToGridButton(); // Snap to pixel button
    this.addBullseyeButton();
    this.layoutToolbarButtons();
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

    this.addsnapToGridListeners();
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
          evented: iconUrl !== ICON_URLS.separator, // Make separator non-interactive
          hoverCursor: iconUrl !== ICON_URLS.separator ? "pointer" : "default", // No pointer cursor for separator
          ignoreTransparentPixels: false, // Add ignoreTransparentPixels property to the button
          excludeFromExport: true,
          toggled: false,
        });

        if (iconUrl !== ICON_URLS.separator) {
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
        }

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

  // add a method to add a toggle grid button
  async addToggleGridButton() {
    const onClick = () => {
      this.compositor.toggleGrid();
      const isGridVisible = this.compositor.preferences.snapToGrid.isGridVisible;
      this.toolbarButtons[BUTTON_INDICES.indexOf("toggleGrid")].set("toggled", isGridVisible ? true : false);
      this.fabricCanvas.renderAll();
    };

    await this.addToolbarButton(ICON_URLS.toggleGrid, onClick, BUTTON_INDICES.indexOf("toggleGrid"), true);
  }

  async addLoadPresetButton() {
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
          this.compositor.restoreFromPreset(preset);
        };
        reader.readAsText(file);
      };
      input.click();
    };

    await this.addToolbarButton(ICON_URLS.loadPreset, onClick, BUTTON_INDICES.indexOf("loadPreset"));
  }

  async addSavePresetButton() {
    const onClick = () => {
      console.log("Saving preset...");
      const config = {
        width: this.compositor.width,
        height: this.compositor.height,
        padding: this.compositor.padding,
        seed: this.compositor.seed,
        onConfigChanged: this.compositor.onConfigChanged,
        isConfigChanged: this.compositor.isConfigChanged,
        preset: JSON.stringify(this.compositor.preset),
        images: this.compositor.images,
      };
      const preset = {
        config: config,
        canvasState: this.compositor.fabricCanvas.toJSON(),
      };
      console.log(preset);
      this.compositor.downloadFile(JSON.stringify(preset), "preset.json");
    };

    await this.addToolbarButton(ICON_URLS.savePreset, onClick, BUTTON_INDICES.indexOf("savePreset"));
  }

  async addExportButton() {
    const  onClick = async() => {
      console.log("Exporting image...");
      const base64Image = this.compositor.exportAsBase64();
      //
      if(this.preferences.standalone){
        this.compositor.downloadFile(base64Image, `${this.compositor.seed}.png`);
        
      }else{
        const result = await this.compositor.uploadImage(base64Image);
        // 
        this.compositor.containerEl.value = `compositor/${result.name} [temp]`;
        //this.compositor.containerEl.value = `compositor/${result.name}`;
        console.log(result);
      }      
      
    };

    await this.addToolbarButton(ICON_URLS.export, onClick, BUTTON_INDICES.indexOf("export"));
  }

  async addBullseyeButton() {
    const onClick = () => {
      // per pixel target find vs ignoreTransparentPixels
      this.compositor.fabricCanvas.perPixelTargetFind = !this.compositor.fabricCanvas.perPixelTargetFind;
      const strokeColor = this.compositor.fabricCanvas.perPixelTargetFind ? this.compositor.preferences.activeBorderColor : this.compositor.preferences.erosColor;
      this.compositor.fabricCanvas.renderAll();
    };

    await this.addToolbarButton(ICON_URLS.bullseye, onClick, BUTTON_INDICES.indexOf("bullseye"), true);
  }

  async addAlignVerticalButton() {
    const onClick = (event) => {
      this.alignSelectedObjectsVertically();
    };

    await this.addToolbarButton(ICON_URLS.alignVertical, onClick, BUTTON_INDICES.indexOf("alignVertical"));
  }

  async addAlignHorizontalButton() {
    const onClick = (event) => {
      this.alignSelectedObjectsHorizontally();
    };

    await this.addToolbarButton(ICON_URLS.alignHorizontal, onClick, BUTTON_INDICES.indexOf("alignHorizontal"));
  }

  async addAlignBothButton() {
    const onClick = (event) => {
      this.alignSelectedObjectsBoth();
    };

    await this.addToolbarButton(ICON_URLS.alignBoth, onClick, BUTTON_INDICES.indexOf("alignBoth"));
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

  addsnapToGridListeners() {
    const gridSize = this.preferences.snapToGrid.gridSize || 1; // Default to 1px if not specified

    this.fabricCanvas.on("object:scaling", (e) => {
      if (this.preferences.snapToGrid.enabled) {
        const obj = e.target;
        obj.set({
          scaleX: (Math.round((obj.scaleX * obj.width) / gridSize) * gridSize) / obj.width,
          scaleY: (Math.round((obj.scaleY * obj.height) / gridSize) * gridSize) / obj.height,
        });
      }
    });

    this.fabricCanvas.on("object:moving", (e) => {
      if (this.preferences.snapToGrid.enabled) {
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
  async addsnapToGridButton() {
    const onClick = () => {
      this.preferences.snapToGrid.enabled = !this.preferences.snapToGrid.enabled;
      this.toolbarButtons[BUTTON_INDICES.indexOf("snapToGrid")].set("toggled", this.preferences.snapToGrid.enabled ? true : false);
      this.fabricCanvas.renderAll();
    };

    await this.addToolbarButton(ICON_URLS.snapToGrid, onClick, BUTTON_INDICES.indexOf("snapToGrid"), true);
  }

  // add a method to add a reset transformations button
  async addResetTransformButton() {
    const onClick = () => {
      const selection = this.fabricCanvas.getActiveObject() ?? this.lastSelection;

      if (selection) {
        if (selection.type === "activeSelection") {
          selection.forEachObject((obj) => {
            obj.set({
              originX: "left",
              originY: "top",
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
            originX: "left",
            originY: "top",
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

    await this.addToolbarButton(ICON_URLS.resetTransform, onClick, BUTTON_INDICES.indexOf("resetTransform"));
  }

  async addAdvancedResetTransformButton() {
    const onClick = () => {
      const selection = this.fabricCanvas.getActiveObject() ?? this.lastSelection;
      const gridSize = this.preferences.snapToGrid.gridSize || 1; // Default to 1px if not specified

      if (selection && this.preferences.equalizeHeight.enabled) {
        const targetHeight = this.compositionRectangle.height;

        const snapToGrid = (value) => Math.round(value / gridSize) * gridSize;

        if (selection.type === "activeSelection") {
          selection.forEachObject((obj) => {
            const scaleFactor = targetHeight / obj.height;
            obj.scale(scaleFactor);

            // Snap to grid
            obj.left = snapToGrid(obj.left);
            obj.top = snapToGrid(obj.top);

            obj.setCoords();
          });
        } else {
          const scaleFactor = targetHeight / selection.height;
          selection.scale(scaleFactor);

          // Snap to grid
          selection.left = snapToGrid(selection.left);
          selection.top = snapToGrid(selection.top);

          selection.setCoords();
        }
        this.fabricCanvas.renderAll();
      }
    };

    await this.addToolbarButton(ICON_URLS.advancedResetTransform, onClick, BUTTON_INDICES.indexOf("advancedResetTransform"));
  }

  // add new button to toggle equalizeHeight.enabled in preferences
  async addEqualizeHeightButton() {
    const onClick = () => {
      this.preferences.equalizeHeight.enabled = !this.preferences.equalizeHeight.enabled;
      this.toolbarButtons[BUTTON_INDICES.indexOf("equalizeHeight")].set("toggled", this.preferences.equalizeHeight.enabled ? true : false);
      this.fabricCanvas.renderAll();
    };

    await this.addToolbarButton(ICON_URLS.equalizeHeight, onClick, BUTTON_INDICES.indexOf("equalizeHeight"), true);
  }
}

export async function fetchSVGIcon(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch SVG icon from ${url}`);
  }
  return await response.text();
}