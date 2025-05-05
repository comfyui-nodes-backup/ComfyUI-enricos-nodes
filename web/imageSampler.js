import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

/**
 * Custom widget for ImageColorSampler that allows clicking on an image to sample colors
 */
app.registerExtension({
    name: "ComfyUI.Enrico.ImageSampler",
    
    async setup() {
        // Listen for image_sampler_init event from Python
        api.addEventListener("image_sampler_init", (event) => {
            const detail = event.detail;
            const node = app.graph.getNodeById(detail.node);
            if (!node) return;
            
            // Forward the data to the node instance
            if (node.onImageSamplerInit) {
                node.onImageSamplerInit(detail.data);
            }
        });
        
        // Listen for image_sampler_update event from Python
        api.addEventListener("image_sampler_update", (event) => {
            const detail = event.detail;
            const node = app.graph.getNodeById(detail.node);
            if (!node) return;
            
            // Update the widget with new value
            const widget = node.widgets.find(w => w.name === detail.widget_name);
            if (widget) {
                widget.value = detail.value;
                app.graph.setDirtyCanvas(true);
                
                // Run the workflow again to continue processing
                app.queuePrompt(0, 1); // Continue the workflow
            }
        });
    },
    
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeType.comfyClass === "ImageColorSampler") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            
            // Override the onNodeCreated method to add our custom widget
            nodeType.prototype.onNodeCreated = function() {
                const result = onNodeCreated?.apply(this, arguments);
                
                // Get references to the input widgets
                const samplePointsWidget = this.widgets.find(w => w.name === "sample_points");
                const paletteSizeWidget = this.widgets.find(w => w.name === "palette_size");
                const sampleSizeWidget = this.widgets.find(w => w.name === "sample_size");
                const waitForInputWidget = this.widgets.find(w => w.name === "wait_for_input");
                
                // Hide the sample_points widget as it's just for data storage
                if (samplePointsWidget) {
                    samplePointsWidget.computeSize = () => [0, -4];
                }
                
                // Create main container for our custom widget
                const container = document.createElement("div");
                container.style.width = "100%";
                container.style.height = "100%";
                container.style.display = "flex";
                container.style.flexDirection = "column";
                container.style.padding = "10px";
                
                // Create image container
                const imageContainer = document.createElement("div");
                imageContainer.style.position = "relative";
                imageContainer.style.width = "100%";
                imageContainer.style.height = "300px";
                imageContainer.style.backgroundColor = "#333";
                imageContainer.style.overflow = "hidden";
                imageContainer.style.display = "flex";
                imageContainer.style.justifyContent = "center";
                imageContainer.style.alignItems = "center";
                imageContainer.style.border = "1px solid #666";
                imageContainer.style.borderRadius = "4px";
                imageContainer.style.cursor = "crosshair";
                
                // Create canvas for image display and interaction
                const canvas = document.createElement("canvas");
                canvas.style.maxWidth = "100%";
                canvas.style.maxHeight = "100%";
                canvas.style.objectFit = "contain";
                canvas.style.position = "absolute";
                canvas.width = 512;
                canvas.height = 512;
                imageContainer.appendChild(canvas);
                
                // Create debug info element to show coordinates (can be hidden in production)
                const debugInfo = document.createElement("div");
                debugInfo.style.position = "absolute";
                debugInfo.style.top = "10px";
                debugInfo.style.left = "10px";
                debugInfo.style.backgroundColor = "rgba(0,0,0,0.5)";
                debugInfo.style.color = "#fff";
                debugInfo.style.padding = "5px";
                debugInfo.style.borderRadius = "3px";
                debugInfo.style.fontSize = "12px";
                debugInfo.style.display = "block"; // Set to "block" for debugging "none" to hide in production
                imageContainer.appendChild(debugInfo);
                
                // Create info panel
                const infoPanel = document.createElement("div");
                infoPanel.style.marginTop = "10px";
                infoPanel.style.padding = "8px";
                infoPanel.style.backgroundColor = "#333";
                infoPanel.style.borderRadius = "4px";
                infoPanel.style.fontSize = "12px";
                infoPanel.style.color = "#ccc";
                infoPanel.innerHTML = "Click on image to add color samples<br>Drag points to move<br>CTRL+Click to remove a point";
                
                // Create buttons container
                const buttonsContainer = document.createElement("div");
                buttonsContainer.style.marginTop = "10px";
                buttonsContainer.style.display = "flex";
                buttonsContainer.style.gap = "10px";
                
                // Create clear button
                const clearButton = document.createElement("button");
                clearButton.textContent = "Clear Samples";
                clearButton.style.padding = "6px 12px";
                clearButton.style.backgroundColor = "#555";
                clearButton.style.color = "white";
                clearButton.style.border = "none";
                clearButton.style.borderRadius = "4px";
                clearButton.style.cursor = "pointer";
                
                // Create continue button
                const continueButton = document.createElement("button");
                continueButton.textContent = "Continue Workflow";
                continueButton.style.padding = "6px 12px";
                continueButton.style.backgroundColor = "#3a88fe";
                continueButton.style.color = "white";
                continueButton.style.border = "none";
                continueButton.style.borderRadius = "4px";
                continueButton.style.cursor = "pointer";
                continueButton.style.marginLeft = "auto";
                
                // Add hover effect for buttons
                [clearButton, continueButton].forEach(button => {
                    button.addEventListener("mouseover", function() {
                        this.style.opacity = "0.8";
                    });
                    button.addEventListener("mouseout", function() {
                        this.style.opacity = "1";
                    });
                });
                
                // Add buttons to container
                buttonsContainer.appendChild(clearButton);
                buttonsContainer.appendChild(continueButton);
                
                // Add checkbox for normalizing image dimensions
                const normalizationControls = document.createElement("div");
                normalizationControls.style.display = "flex";
                normalizationControls.style.alignItems = "center";
                normalizationControls.style.marginTop = "10px";
                normalizationControls.style.gap = "10px";
                
                const normalizeCheckbox = document.createElement("input");
                normalizeCheckbox.type = "checkbox";
                normalizeCheckbox.id = "normalize-size-" + this.id;
                normalizeCheckbox.style.cursor = "pointer";
                
                const normalizeLabel = document.createElement("label");
                normalizeLabel.htmlFor = "normalize-size-" + this.id;
                normalizeLabel.textContent = "Normalize to 512px height";
                normalizeLabel.style.fontSize = "12px";
                normalizeLabel.style.cursor = "pointer";
                
                normalizationControls.appendChild(normalizeCheckbox);
                normalizationControls.appendChild(normalizeLabel);
                
                // Variable to track normalization state
                let isNormalizedView = false;
                
                // Add elements to container in the correct order
                container.appendChild(imageContainer);
                container.appendChild(infoPanel);
                container.appendChild(normalizationControls);
                container.appendChild(buttonsContainer);
                
                // Sample points data
                let samplePoints = [];
                const pointSize = 5; // Radius of sample points
                
                // Canvas context and state
                const ctx = canvas.getContext("2d");
                let image = null;
                let imageBase64 = null;
                let selectedPoint = -1;
                let isDragging = false;
                let nodeId = null;
                
                // Store actual dimensions of the original image
                let originalImageWidth = 0;
                let originalImageHeight = 0;
                
                // Store canvas positioning info
                let canvasOffset = { x: 0, y: 0 };
                let canvasScaledWidth = 0;
                let canvasScaledHeight = 0;
                
                // Method to handle data from Python
                this.onImageSamplerInit = (data) => {
                    if (!data) return;
                    
                    // Store node ID for API calls
                    nodeId = data.node_id;
                    
                    // Load points if any
                    if (data.sample_points && Array.isArray(data.sample_points)) {
                        samplePoints = data.sample_points;
                    }
                    
                    // Update sample size if provided
                    if (data.sample_size && sampleSizeWidget) {
                        sampleSizeWidget.value = data.sample_size;
                    }
                    
                    // Load image if provided
                    if (data.image) {
                        imageBase64 = data.image;
                        loadImageFromBase64(data.image);
                    }
                };
                
                // Load and display image from base64
                const loadImageFromBase64 = (base64Data) => {
                    const img = new Image();
                    img.onload = () => {
                        // Store original image dimensions
                        originalImageWidth = img.width;
                        originalImageHeight = img.height;
                        
                        // Calculate dimensions to maintain aspect ratio
                        const containerWidth = imageContainer.clientWidth;
                        const containerHeight = imageContainer.clientHeight;
                        
                        // Determine scale factor for fitting the image
                        const scaleWidth = containerWidth / img.width;
                        const scaleHeight = containerHeight / img.height;
                        const scale = Math.min(scaleWidth, scaleHeight);
                        
                        // Calculate the actual dimensions the image will be shown at
                        canvasScaledWidth = Math.round(img.width * scale);
                        canvasScaledHeight = Math.round(img.height * scale);
                        
                        // Set canvas size to match the scaled image
                        canvas.width = canvasScaledWidth;
                        canvas.height = canvasScaledHeight;
                        
                        // Calculate offsets to center the image in the container
                        canvasOffset.x = Math.round((containerWidth - canvasScaledWidth) / 2);
                        canvasOffset.y = Math.round((containerHeight - canvasScaledHeight) / 2);
                        
                        // Position the canvas
                        canvas.style.left = canvasOffset.x + "px";
                        canvas.style.top = canvasOffset.y + "px";
                        
                        // Draw the image
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        
                        // Store image reference
                        image = img;
                        
                        // Draw sample points if any
                        drawSamplePoints();
                    };
                    
                    img.src = base64Data;
                };
                
                // Function to continue workflow
                const continueWorkflow = () => {
                    if (!nodeId) return;
                    
                    // Send data back to server to continue the workflow
                    api.fetchApi("/image_sampler/continue", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            node_id: nodeId,
                            sample_points: samplePoints
                        })
                    }).catch(err => console.error("Error continuing workflow:", err));
                };
                
                // Draw sample points
                const drawSamplePoints = () => {
                    if (!ctx || !canvas.width) return;
                    
                    // Redraw the image
                    if (image) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                    }
                    
                    // Draw each sample point
                    samplePoints.forEach((point, index) => {
                        // Convert normalized coordinates to canvas pixels
                        const x = Math.round(point.x * canvas.width);
                        const y = Math.round(point.y * canvas.height);
                        
                        // Draw outer circle
                        ctx.beginPath();
                        ctx.arc(x, y, pointSize + 2, 0, Math.PI * 2);
                        ctx.fillStyle = "black";
                        ctx.fill();
                        
                        // Draw inner circle with sampled color
                        ctx.beginPath();
                        ctx.arc(x, y, pointSize, 0, Math.PI * 2);
                        ctx.fillStyle = point.color || "#ffffff";
                        ctx.fill();
                        
                        // Highlight selected point
                        if (index === selectedPoint) {
                            ctx.beginPath();
                            ctx.arc(x, y, pointSize + 4, 0, Math.PI * 2);
                            ctx.strokeStyle = "yellow";
                            ctx.lineWidth = 2;
                            ctx.stroke();
                        }
                    });
                };
                
                // Convert mouse position to normalized coordinates (0-1)
                const mouseToNormalized = (mouseX, mouseY) => {
                    // Get position relative to canvas
                    const canvasX = mouseX;
                    const canvasY = mouseY;
                    
                    // Convert to normalized coordinates (0-1)
                    // We use the canvas dimensions which are set to match the actual displayed image dimensions
                    const normalizedX = canvasX / canvas.width;
                    const normalizedY = canvasY / canvas.height;
                    
                    // Ensure we stay within bounds
                    return {
                        x: Math.max(0, Math.min(1, normalizedX)),
                        y: Math.max(0, Math.min(1, normalizedY)),
                        canvasX: canvasX,
                        canvasY: canvasY
                    };
                };
                
                // Convert normalized coordinates to canvas position
                const normalizedToCanvas = (normalizedX, normalizedY) => {
                    return {
                        x: normalizedX * canvas.width,
                        y: normalizedY * canvas.height
                    };
                };
                
                // Check if a point is under the cursor
                const getPointAtPosition = (x, y) => {
                    for (let i = samplePoints.length - 1; i >= 0; i--) {
                        const point = samplePoints[i];
                        const canvasPos = normalizedToCanvas(point.x, point.y);
                        
                        const distance = Math.sqrt(
                            Math.pow(x - canvasPos.x, 2) + Math.pow(y - canvasPos.y, 2)
                        );
                        
                        if (distance <= pointSize * 2) { // Slightly larger hit area for easier selection
                            return i;
                        }
                    }
                    return -1;
                };
                
                // Get pixel color at a specific position
                const getPixelColorAtPosition = (x, y) => {
                    if (!ctx) return "#FFFFFF";
                    
                    try {
                        // Ensure coordinates are integers and within canvas bounds
                        const pixelX = Math.max(0, Math.min(canvas.width - 1, Math.floor(x)));
                        const pixelY = Math.max(0, Math.min(canvas.height - 1, Math.floor(y)));
                        
                        // Get the pixel data at the exact point
                        const pixelData = ctx.getImageData(pixelX, pixelY, 1, 1).data;
                        
                        // Convert to hex color
                        return `#${pixelData[0].toString(16).padStart(2,'0')}${
                            pixelData[1].toString(16).padStart(2,'0')}${
                            pixelData[2].toString(16).padStart(2,'0')}`;
                    } catch (e) {
                        console.error("Error getting pixel color:", e);
                        return "#FFFFFF";
                    }
                };
                
                // Update debug info display
                const updateDebugInfo = (info) => {
                    if (debugInfo) {
                        debugInfo.textContent = info;
                    }
                };
                
                // Handle mouse events on canvas
                canvas.addEventListener("mousedown", (e) => {
                    e.preventDefault(); // Prevent default browser behavior
                    
                    const rect = canvas.getBoundingClientRect();
                    // Get exact cursor position relative to canvas
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;
                    
                    updateDebugInfo(`Mouse: ${mouseX.toFixed(1)}, ${mouseY.toFixed(1)}`);
                    
                    // Check if click is on an existing point
                    const pointIndex = getPointAtPosition(mouseX, mouseY);
                    
                    if (pointIndex >= 0) {
                        if (e.ctrlKey) {
                            // CTRL+click to delete point
                            samplePoints.splice(pointIndex, 1);
                            selectedPoint = -1;
                            updateSamplePointsWidget();
                            drawSamplePoints();
                        } else {
                            // Select point for dragging
                            selectedPoint = pointIndex;
                            isDragging = true;
                            drawSamplePoints();
                        }
                    } else if (mouseX >= 0 && mouseX <= canvas.width && 
                              mouseY >= 0 && mouseY <= canvas.height && image) {
                        // Calculate normalized coordinates for the new point
                        const normalized = mouseToNormalized(mouseX, mouseY);
                        
                        // Add new point
                        const newPoint = { 
                            x: normalized.x, 
                            y: normalized.y, 
                            color: getPixelColorAtPosition(mouseX, mouseY) // Sample color immediately
                        };
                        
                        samplePoints.push(newPoint);
                        selectedPoint = samplePoints.length - 1;
                        isDragging = true;
                        
                        updateSamplePointsWidget();
                        drawSamplePoints();
                    }
                });
                
                canvas.addEventListener("mousemove", (e) => {
                    if (!isDragging || selectedPoint < 0) return;
                    
                    e.preventDefault();
                    
                    const rect = canvas.getBoundingClientRect();
                    // Get exact cursor position relative to canvas
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;
                    
                    // Calculate normalized coordinates
                    const normalized = mouseToNormalized(mouseX, mouseY);
                    
                    // Update point position with normalized coordinates
                    samplePoints[selectedPoint].x = normalized.x;
                    samplePoints[selectedPoint].y = normalized.y;
                    
                    // Update debug info
                    updateDebugInfo(`Point: (${normalized.x.toFixed(3)}, ${normalized.y.toFixed(3)})`);
                    
                    // Update color at new position
                    samplePoints[selectedPoint].color = getPixelColorAtPosition(mouseX, mouseY);
                    
                    drawSamplePoints();
                });
                
                const handleMouseUp = (e) => {
                    if (isDragging && selectedPoint >= 0) {
                        e.preventDefault();
                        isDragging = false;
                        updateSamplePointsWidget();
                    }
                };
                
                // Track mouse position for debugging
                canvas.addEventListener("mousemove", (e) => {
                    if (debugInfo.style.display !== "block") return;
                    
                    const rect = canvas.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;
                    
                    const normalized = mouseToNormalized(mouseX, mouseY);
                    updateDebugInfo(
                        `Mouse: ${mouseX.toFixed(1)}, ${mouseY.toFixed(1)} | ` +
                        `Norm: ${normalized.x.toFixed(3)}, ${normalized.y.toFixed(3)}`
                    );
                });
                
                canvas.addEventListener("mouseup", handleMouseUp);
                canvas.addEventListener("mouseleave", handleMouseUp);
                
                // Update the hidden widget with sample points data
                const updateSamplePointsWidget = () => {
                    if (samplePointsWidget) {
                        samplePointsWidget.value = JSON.stringify(samplePoints);
                        this.setDirtyCanvas(true);
                    }
                };
                
                // Clear all sample points
                clearButton.addEventListener("click", () => {
                    samplePoints = [];
                    selectedPoint = -1;
                    updateSamplePointsWidget();
                    drawSamplePoints();
                });
                
                // Continue workflow button
                continueButton.addEventListener("click", () => {
                    continueWorkflow();
                });
                
                // Handle normalization checkbox
                normalizeCheckbox.addEventListener('change', function() {
                    isNormalizedView = this.checked;
                    
                    if (!image) return;
                    
                    // Recalculate canvas size based on normalization setting
                    const containerWidth = imageContainer.clientWidth;
                    const containerHeight = imageContainer.clientHeight;
                    
                    if (isNormalizedView) {
                        // Normalize to 512px height
                        const aspectRatio = originalImageWidth / originalImageHeight;
                        const normalizedHeight = 512;
                        const normalizedWidth = Math.round(normalizedHeight * aspectRatio);
                        
                        // Set canvas to normalized dimensions
                        canvas.width = normalizedWidth;
                        canvas.height = normalizedHeight;
                        
                        // Center the canvas in the container
                        canvasOffset.x = Math.round((containerWidth - normalizedWidth) / 2);
                        canvasOffset.y = Math.round((containerHeight - normalizedHeight) / 2);
                        
                    } else {
                        // Use container-fitted size (original behavior)
                        const scaleWidth = containerWidth / originalImageWidth;
                        const scaleHeight = containerHeight / originalImageHeight;
                        const scale = Math.min(scaleWidth, scaleHeight);
                        
                        canvasScaledWidth = Math.round(originalImageWidth * scale);
                        canvasScaledHeight = Math.round(originalImageHeight * scale);
                        
                        canvas.width = canvasScaledWidth;
                        canvas.height = canvasScaledHeight;
                        
                        canvasOffset.x = Math.round((containerWidth - canvasScaledWidth) / 2);
                        canvasOffset.y = Math.round((containerHeight - canvasScaledHeight) / 2);
                    }
                    
                    // Position the canvas
                    canvas.style.left = canvasOffset.x + "px";
                    canvas.style.top = canvasOffset.y + "px";
                    
                    // Redraw everything
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                    drawSamplePoints();
                });
                
                // When the node receives the output from processing
                this.onExecuted = function(output) {
                    if (!output || !output.hasResult) return;
                    
                    // If we have a sampled colors result, update point colors
                    if (output.sampled_colors) {
                        try {
                            const colors = JSON.parse(output.sampled_colors);
                            if (Array.isArray(colors) && colors.length > 0) {
                                // Update point colors
                                colors.forEach((colorData, index) => {
                                    if (index < samplePoints.length) {
                                        samplePoints[index].color = colorData.hex;
                                    }
                                });
                                drawSamplePoints();
                            }
                        } catch (e) {
                            console.error("Error parsing sampled colors:", e);
                        }
                    }
                };
                
                // Handle image input changes
                this.onImageInput = function(inputData) {
                    // Schedule image loading for next frame to ensure DOM is ready
                    if (inputData && inputData.tensor) {
                        setTimeout(() => loadImageToCanvas(inputData), 0);
                    } else if (imageBase64) {
                        // If we have a base64 image from Python, use that
                        setTimeout(() => loadImageFromBase64(imageBase64), 0);
                    }
                };
                
                // Load and display image from tensor data
                const loadImageToCanvas = (imgData) => {
                    if (!imgData) return;
                    
                    // Store original image dimensions
                    originalImageWidth = imgData.width;
                    originalImageHeight = imgData.height;
                    
                    // Create image from tensor data
                    const imgPixels = new Uint8ClampedArray(imgData.data);
                    const imgDataObj = new ImageData(imgPixels, imgData.width, imgData.height);
                    
                    const offscreenCanvas = new OffscreenCanvas(imgData.width, imgData.height);
                    const offCtx = offscreenCanvas.getContext("2d");
                    offCtx.putImageData(imgDataObj, 0, 0);
                    
                    // Create image object from the offscreen canvas
                    offscreenCanvas.convertToBlob().then(blob => {
                        const img = new Image();
                        img.onload = () => {
                            // Calculate dimensions to maintain aspect ratio
                            const containerWidth = imageContainer.clientWidth;
                            const containerHeight = imageContainer.clientHeight;
                            
                            // Determine scale factor for fitting the image
                            const scaleWidth = containerWidth / img.width;
                            const scaleHeight = containerHeight / img.height;
                            const scale = Math.min(scaleWidth, scaleHeight);
                            
                            // Calculate the actual dimensions the image will be shown at
                            canvasScaledWidth = Math.round(img.width * scale);
                            canvasScaledHeight = Math.round(img.height * scale);
                            
                            // Set canvas size to match the scaled image
                            canvas.width = canvasScaledWidth;
                            canvas.height = canvasScaledHeight;
                            
                            // Calculate offsets to center the image in the container
                            canvasOffset.x = Math.round((containerWidth - canvasScaledWidth) / 2);
                            canvasOffset.y = Math.round((containerHeight - canvasScaledHeight) / 2);
                            
                            // Position the canvas
                            canvas.style.left = canvasOffset.x + "px";
                            canvas.style.top = canvasOffset.y + "px";
                            
                            // Draw the image
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                            
                            // Store image reference
                            image = img;
                            
                            // Draw sample points if any
                            drawSamplePoints();
                        };
                        img.src = URL.createObjectURL(blob);
                    });
                };
                
                // Handle window resize to reposition points correctly
                const resizeObserver = new ResizeObserver(() => {
                    if (image) {
                        // Recalculate canvas size and position
                        const containerWidth = imageContainer.clientWidth;
                        const containerHeight = imageContainer.clientHeight;
                        
                        // Determine scale factor for fitting the image
                        const scaleWidth = containerWidth / originalImageWidth;
                        const scaleHeight = containerHeight / originalImageHeight;
                        const scale = Math.min(scaleWidth, scaleHeight);
                        
                        // Calculate the actual dimensions the image will be shown at
                        canvasScaledWidth = Math.round(originalImageWidth * scale);
                        canvasScaledHeight = Math.round(originalImageHeight * scale);
                        
                        // Set canvas size to match the scaled image
                        canvas.width = canvasScaledWidth;
                        canvas.height = canvasScaledHeight;
                        
                        // Calculate offsets to center the image in the container
                        canvasOffset.x = Math.round((containerWidth - canvasScaledWidth) / 2);
                        canvasOffset.y = Math.round((containerHeight - canvasScaledHeight) / 2);
                        
                        // Position the canvas
                        canvas.style.left = canvasOffset.x + "px";
                        canvas.style.top = canvasOffset.y + "px";
                        
                        // Redraw everything
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                        drawSamplePoints();
                    }
                });
                
                // Start observing size changes
                resizeObserver.observe(imageContainer);
                
                // Add the DOM widget to the node
                this.addDOMWidget("image_sampler_widget", "image_sampler", container, {
                    serialize: false,
                    hideOnZoom: false,
                });
                
                // Make the input widgets smaller
                if (paletteSizeWidget) paletteSizeWidget.computeSize = () => [100, 24];
                if (sampleSizeWidget) paletteSizeWidget.computeSize = () => [100, 24];
                if (waitForInputWidget) waitForInputWidget.computeSize = () => [100, 24];
                
                return result;
            };
            
            // Add method to capture image input data
            const onConnectionsChange = nodeType.prototype.onConnectionsChange;
            nodeType.prototype.onConnectionsChange = function(type, slotIndex, isConnected, link_info, output) {
                const result = onConnectionsChange?.apply(this, arguments);
                
                // Process only when connecting an input
                if (type === LiteGraph.INPUT && isConnected) {
                    // Get the linked node
                    const linkedNode = this.graph.getNodeById(link_info.origin_id);
                    if (linkedNode) {
                        const inputSlot = link_info.origin_slot;
                        const outputData = linkedNode.outputs[inputSlot];
                        
                        // Check if this is an image input
                        if (outputData && outputData.type === "IMAGE") {
                            // Access the tensor data if available
                            const tensorData = linkedNode.getOutputData ? linkedNode.getOutputData(inputSlot) : null;
                            
                            if (tensorData && this.onImageInput) {
                                this.onImageInput({ tensor: tensorData });
                            }
                        }
                    }
                } else if (type === LiteGraph.INPUT && !isConnected) {
                    // If image input is disconnected, clear the canvas
                    const widget = this.widgets.find(w => w.name === "image_sampler_widget");
                    if (widget && widget.value) {
                        const canvas = widget.value.querySelector("canvas");
                        if (canvas) {
                            const ctx = canvas.getContext("2d");
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                        }
                    }
                }
                
                return result;
            };
            
            // Ensure the node updates when new image data is available
            const onExecute = nodeType.prototype.onExecute;
            nodeType.prototype.onExecute = function() {
                const result = onExecute?.apply(this, arguments);
                
                // Check if we have image input
                const imageInput = this.getInputData(0);
                if (imageInput && this.onImageInput) {
                    this.onImageInput({ tensor: imageInput });
                }
                
                return result;
            };
        }
    },
});