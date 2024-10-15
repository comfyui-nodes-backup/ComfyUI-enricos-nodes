import { app } from "../../scripts/app.js";

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
    standalone: false, // whether we are testing this in index.html or in the comfy editor
};

function addCompositorPreferences(preferences) {
    app.ui.settings.addSetting({
        id: "Compositor4.Composition.FILL",
        name: "Composition Fill",
        tooltip: "Fill color for the composition rectangle",
        type: "text",
        defaultValue: preferences.composition.fill,
        onChange: (newVal, oldVal) => {
            // Handle change
        },
    });

    app.ui.settings.addSetting({
        id: "Compositor4.Composition.STROKE",
        name: "Composition Stroke",
        tooltip: "Stroke color for the composition rectangle",
        type: "text",
        defaultValue: preferences.composition.stroke,
        onChange: (newVal, oldVal) => {
            // Handle change
        },
    });

    app.ui.settings.addSetting({
        id: "Compositor4.Composition.STROKE_WIDTH",
        name: "Composition Stroke Width",
        tooltip: "Stroke width for the composition rectangle",
        type: "number",
        defaultValue: preferences.composition.strokeWidth,
        onChange: (newVal, oldVal) => {
            // Handle change
        },
    });

    app.ui.settings.addSetting({
        id: "Compositor4.Toolbar.FILL",
        name: "Toolbar Fill",
        tooltip: "Fill color for the toolbar",
        type: "text",
        defaultValue: preferences.toolbar.fill,
        onChange: (newVal, oldVal) => {
            // Handle change
        },
    });

    app.ui.settings.addSetting({
        id: "Compositor4.Toolbar.HEIGHT",
        name: "Toolbar Height",
        tooltip: "Height of the toolbar",
        type: "number",
        defaultValue: preferences.toolbar.height,
        onChange: (newVal, oldVal) => {
            // Handle change
        },
    });

    app.ui.settings.addSetting({
        id: "Compositor4.Toolbar.POSITION",
        name: "Toolbar Position",
        tooltip: "Position of the toolbar",
        type: "object",
        defaultValue: preferences.toolbar.position,
        onChange: (newVal, oldVal) => {
            // Handle change
        },
    });

    app.ui.settings.addSetting({
        id: "Compositor4.Toolbar.BUTTON_SPACING",
        name: "Toolbar Button Spacing",
        tooltip: "Spacing between toolbar buttons",
        type: "number",
        defaultValue: preferences.toolbar.buttonSpacing,
        onChange: (newVal, oldVal) => {
            // Handle change
        },
    });

    app.ui.settings.addSetting({
        id: "Compositor4.Toolbar.ICON_SIZE",
        name: "Toolbar Icon Size",
        tooltip: "Size of the toolbar icons",
        type: "number",
        defaultValue: preferences.toolbar.iconSize,
        onChange: (newVal, oldVal) => {
            // Handle change
        },
    });

    app.ui.settings.addSetting({
        id: "Compositor4.FabricCanvas.BACKGROUND_COLOR",
        name: "Fabric Canvas Background Color",
        tooltip: "Background color for the fabric canvas",
        type: "text",
        defaultValue: preferences.fabricCanvas.backgroundColor,
        onChange: (newVal, oldVal) => {
            // Handle change
        },
    });

    app.ui.settings.addSetting({
        id: "Compositor4.EqualizeHeight.ENABLED",
        name: "Equalize Height Enabled",
        tooltip: "Enable or disable equalize height",
        type: "boolean",
        defaultValue: preferences.equalizeHeight.enabled,
        onChange: (newVal, oldVal) => {
            // Handle change
        },
    });

    app.ui.settings.addSetting({
        id: "Compositor4.SnapToGrid.GRID_SIZE",
        name: "Snap to Grid Size",
        tooltip: "Grid size for snap to grid",
        type: "number",
        defaultValue: preferences.snapToGrid.gridSize,
        onChange: (newVal, oldVal) => {
            // Handle change
        },
    });

    app.ui.settings.addSetting({
        id: "Compositor4.SnapToGrid.ENABLED",
        name: "Snap to Grid Enabled",
        tooltip: "Enable or disable snap to grid",
        type: "boolean",
        defaultValue: preferences.snapToGrid.enabled,
        onChange: (newVal, oldVal) => {
            // Handle change
        },
    });

    app.ui.settings.addSetting({
        id: "Compositor4.SnapToGrid.IS_GRID_VISIBLE",
        name: "Snap to Grid Visibility",
        tooltip: "Visibility of the snap to grid",
        type: "boolean",
        defaultValue: preferences.snapToGrid.isGridVisible,
        onChange: (newVal, oldVal) => {
            // Handle change
        },
    });

    app.ui.settings.addSetting({
        id: "Compositor4.IgnoreTransparentPixels.ENABLED",
        name: "Ignore Transparent Pixels Enabled",
        tooltip: "Enable or disable ignoring transparent pixels",
        type: "boolean",
        defaultValue: preferences.ignoreTransparentPixels.enabled,
        onChange: (newVal, oldVal) => {
            // Handle change
        },
    });

    app.ui.settings.addSetting({
        id: "Compositor4.ErosColor",
        name: "Eros Color",
        tooltip: "Color for eros",
        type: "text",
        defaultValue: preferences.erosColor,
        onChange: (newVal, oldVal) => {
            // Handle change
        },
    });

    app.ui.settings.addSetting({
        id: "Compositor4.ActiveBorderColor",
        name: "Active Border Color",
        tooltip: "Border color when button is active",
        type: "text",
        defaultValue: preferences.activeBorderColor,
        onChange: (newVal, oldVal) => {
            // Handle change
        },
    });

    app.ui.settings.addSetting({
        id: "Compositor4.InactiveBorderColor",
        name: "Inactive Border Color",
        tooltip: "Border color when button is inactive",
        type: "text",
        defaultValue: preferences.inactiveBorderColor,
        onChange: (newVal, oldVal) => {
            // Handle change
        },
    });

    app.ui.settings.addSetting({
        id: "Compositor4.ToggledBorderColor",
        name: "Toggled Border Color",
        tooltip: "Border color when button is toggled",
        type: "text",
        defaultValue: preferences.toggledBorderColor,
        onChange: (newVal, oldVal) => {
            // Handle change
        },
    });

    app.ui.settings.addSetting({
        id: "Compositor4.Standalone",
        name: "Standalone Mode",
        tooltip: "Whether we are testing this in index.html or in the comfy editor",
        type: "boolean",
        defaultValue: preferences.standalone,
        onChange: (newVal, oldVal) => {
            // Handle change
        },
    });
}

function getPreferences() {
    return {
        composition: {
            fill: app.ui.settings.getSettingValue("Compositor4.Composition.FILL", "#444444"),
            stroke: app.ui.settings.getSettingValue("Compositor4.Composition.STROKE", "green"),
            strokeWidth: app.ui.settings.getSettingValue("Compositor4.Composition.STROKE_WIDTH", 1),
        },
        toolbar: {
            fill: app.ui.settings.getSettingValue("Compositor4.Toolbar.FILL", "#666666"),
            height: app.ui.settings.getSettingValue("Compositor4.Toolbar.HEIGHT", 40),
            position: app.ui.settings.getSettingValue("Compositor4.Toolbar.POSITION", { left: 0, top: 0 }),
            buttonSpacing: app.ui.settings.getSettingValue("Compositor4.Toolbar.BUTTON_SPACING", 4),
            iconSize: app.ui.settings.getSettingValue("Compositor4.Toolbar.ICON_SIZE", 40),
        },
        fabricCanvas: {
            backgroundColor: app.ui.settings.getSettingValue("Compositor4.FabricCanvas.BACKGROUND_COLOR", "#555555"),
        },
        equalizeHeight: {
            enabled: app.ui.settings.getSettingValue("Compositor4.EqualizeHeight.ENABLED", true),
        },
        snapToGrid: {
            gridSize: app.ui.settings.getSettingValue("Compositor4.SnapToGrid.GRID_SIZE", 20),
            enabled: app.ui.settings.getSettingValue("Compositor4.SnapToGrid.ENABLED", false),
            isGridVisible: app.ui.settings.getSettingValue("Compositor4.SnapToGrid.IS_GRID_VISIBLE", false),
        },
        ignoreTransparentPixels: {
            enabled: app.ui.settings.getSettingValue("Compositor4.IgnoreTransparentPixels.ENABLED", false),
        },
        erosColor: app.ui.settings.getSettingValue("Compositor4.ErosColor", "magenta"),
        activeBorderColor: app.ui.settings.getSettingValue("Compositor4.ActiveBorderColor", "magenta"),
        inactiveBorderColor: app.ui.settings.getSettingValue("Compositor4.InactiveBorderColor", "black"),
        toggledBorderColor: app.ui.settings.getSettingValue("Compositor4.ToggledBorderColor", "orange"),
        standalone: app.ui.settings.getSettingValue("Compositor4.Standalone", false),
    };
}

// Call the function to add settings
export { addCompositorPreferences, PREFERENCES, getPreferences};
