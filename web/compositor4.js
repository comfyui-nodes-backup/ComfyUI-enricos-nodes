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
                fill: '#696969', // Dark gray color for the rectangle
                stroke: 'green', // Green border
                strokeWidth: 1
            },
            toolbar: {
                fill: '#333', // Dark gray color for the toolbar background
                height: 40,
                position: { left: 0, top: 0 }
            }
        };

        // Register event listeners
        ['executed', 'init'].forEach(eventType => {
            document.addEventListener(eventType, (event) => this.setup(event.detail));
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
                fill: '#696969', // Dark gray color for the rectangle
                stroke: 'green', // Green border
                strokeWidth: 1
            },
            toolbar: {
                fill: '#333', // Dark gray color for the toolbar background
                height: 40,
                position: { left: 0, top: 0 }
            }
        };

        this.preferences = fetchedPreferences;
    }

    /**
     * Creates a canvas element and initializes fabric.js on it.
     */
    createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.id = 'fcanvas';
        canvas.width = this.width + this.padding * 2;
        canvas.height = this.height + this.padding * 2;
        document.body.appendChild(canvas);

        this.fabricCanvas = new fabric.Canvas(canvas.id, {
            width: this.width + this.padding * 2,
            height: this.height + this.padding * 2,
            backgroundColor: '#A9A9A9', // Darker gray color for the canvas background,
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
            evented: false // Ensure it is always on top and not interactive
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
            fill: 'transparent', // Transparent background
            stroke: this.preferences.composition.stroke, // Use preferences for stroke color
            strokeWidth: this.preferences.composition.strokeWidth, // Use preferences for stroke width
            selectable: false, // Make the overlay non-interactive
            evented: false // Ensure it is always on top and not interactive
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
        this.createImages();
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
            fabric.Image.fromURL(b64Image, (img) => {
                img.set({
                    left: this.padding,
                    top: this.padding,                    
                });

                // this.equalizeImageHeight(img);
                this.fabricCanvas.add(img);
                //this.fabricCanvas.renderAll();
            });
        });
    }

    /**
     * Equalizes the image height to the height of the composition rectangle.
     * The width of the input image is scaled preserving the initial ratio.
     * @param {fabric.Image} img - The fabric image object to be resized.
     */
    equalizeImageHeight(img) {
        const scaleFactor = this.height / img.height;
        img.scale(scaleFactor);
    }

    /**
     * add a method that create 5 base 64 images each should have a different color and a number in the center (from 1 to 5),
     * the images should have different width and height at most 30% of the composition width and height 
     */
    createImages() {
        const colors = ['#FFB3BA', '#B3FFB3', '#BAE1FF', '#FFFFBA', '#FFDFBA'];
        const numbers = ['1', '2', '3', '4', '5'];

        colors.forEach((color, index) => {
            const number = numbers[index];
            const width = (Math.random() * 0.2 + 0.1) * this.width;
            const height = (Math.random() * 0.2 + 0.1) * this.height;

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = 'black';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(number, width / 2, height / 2);

            this.images.push(canvas.toDataURL());
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
            evented: false
        });

        this.fabricCanvas.add(toolbar);
        //this.fabricCanvas.bringToFront(toolbar);
        //this.fabricCanvas.renderAll();
    }

    bringToFront() {
        this.fabricCanvas.bringToFront(this.compositionOverlay);
        this.fabricCanvas.bringToFront(this.toolbar);
        this.fabricCanvas.renderAll();
    }
}
