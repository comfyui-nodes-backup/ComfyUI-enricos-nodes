import folder_paths
from PIL import Image, ImageOps
import numpy as np
import torch
from comfy_execution.graph import ExecutionBlocker
import threading
from server import PromptServer
from aiohttp import web
import json # Added import for json parsing

thread = None
g_node_id = None
g_filename = None
threads = []

# Helper functions (assuming these are standard ComfyUI tensor/PIL conversions)
def tensor2pil(image: torch.Tensor) -> Image.Image:
    return Image.fromarray(np.clip(255. * image.cpu().numpy().squeeze(0), 0, 255).astype(np.uint8))

def pil2tensor(image: Image.Image) -> torch.Tensor:
    return torch.from_numpy(np.array(image).astype(np.float32) / 255.0).unsqueeze(0)

# Add a new helper function for placing images on a canvas with proper positioning
def place_on_canvas(image_tensor, canvas_width, canvas_height, left, top, scale_x=1.0, scale_y=1.0, mask_tensor=None):
    """
    Place an image tensor on a canvas of specified dimensions at the given position.
    Images exceeding canvas boundaries will be truncated.
    
    Parameters:
    - image_tensor: Torch tensor image to place
    - canvas_width, canvas_height: Dimensions of the target canvas
    - left, top: Position to place the image (top-left corner)
    - scale_x, scale_y: Optional scaling factors
    - mask_tensor: Optional mask tensor to apply to the image
    
    Returns:
    - Tuple of (positioned image tensor, positioned mask tensor)
    """
    if image_tensor is None:
        return None, None
        
    try:
        # Convert tensor to PIL for manipulation
        pil_image = tensor2pil(image_tensor)
        pil_mask = tensor2pil(mask_tensor) if mask_tensor is not None else None
        
        # Apply scaling if needed (different from 1.0)
        original_width, original_height = pil_image.size
        if scale_x != 1.0 or scale_y != 1.0:
            new_width = int(original_width * scale_x)
            new_height = int(original_height * scale_y)
            if new_width > 0 and new_height > 0:  # Ensure dimensions are valid
                pil_image = pil_image.resize((new_width, new_height), Image.Resampling.LANCZOS)
                if pil_mask is not None:
                    pil_mask = pil_mask.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Create a blank canvas for the image
        canvas = Image.new('RGB', (canvas_width, canvas_height), (0, 0, 0))
        # Create a blank canvas for the mask (if present)
        mask_canvas = None
        if pil_mask is not None:
            mask_canvas = Image.new('RGB', (canvas_width, canvas_height), (0, 0, 0))
        
        # Calculate position with integer precision
        pos_left = int(left)
        pos_top = int(top)
        
        # Paste the image onto the canvas - PIL will handle truncation automatically
        # when the image extends beyond canvas boundaries
        canvas.paste(pil_image, (pos_left, pos_top))
        
        # Process mask if present
        positioned_mask_tensor = None
        if pil_mask is not None and mask_canvas is not None:
            mask_canvas.paste(pil_mask, (pos_left, pos_top))
            positioned_mask_tensor = pil2tensor(mask_canvas)
        
        # Convert back to tensor
        positioned_image_tensor = pil2tensor(canvas)
        
        return positioned_image_tensor, positioned_mask_tensor
    except Exception as e:
        print(f"Error placing image on canvas: {e}")
        return image_tensor, mask_tensor  # Return original on error


routes = PromptServer.instance.routes
@routes.post('/compositor/done')
async def receivedDone(request):
    return web.json_response({})

class Compositor3:
    file = "new.png"
    result = None
    configCache = None

    @classmethod
    def IS_CHANGED(cls, **kwargs):
        fabricData = kwargs.get("fabricData")
        # print(fabricData)
        return fabricData

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "config": ("COMPOSITOR_CONFIG", {"forceInput": True}),
                "extendedConfig": ("COMPOSITOR_CONFIG", {"forceInput": True}), # Added extendedConfig input
                "fabricData": ("STRING", {"default": "{}"}),
                "imageName": ("STRING", {"default": "new.png"}),
            },
            "optional": {
                "tools": ("BOOLEAN", {"forceInput": True, "default": True}),
            },
            "hidden": {
                "extra_pnginfo": "EXTRA_PNGINFO",
                "node_id": "UNIQUE_ID",
            },
        }

    # Updated RETURN_TYPES and RETURN_NAMES to include mask outputs
    RETURN_TYPES = ("STRING", "IMAGE", 
                    "IMAGE", "IMAGE", "IMAGE", "IMAGE", "IMAGE", "IMAGE", "IMAGE", "IMAGE",
                    "IMAGE", "IMAGE", "IMAGE", "IMAGE", "IMAGE", "IMAGE", "IMAGE", "IMAGE")
    RETURN_NAMES = ("transforms", "image", 
                   "image_out_1", "image_out_2", "image_out_3", "image_out_4", 
                   "image_out_5", "image_out_6", "image_out_7", "image_out_8",
                   "mask_out_1", "mask_out_2", "mask_out_3", "mask_out_4", 
                   "mask_out_5", "mask_out_6", "mask_out_7", "mask_out_8")
    FUNCTION = "composite"
    CATEGORY = "image"

    def composite(self, **kwargs):
        # https://blog.miguelgrinberg.com/post/how-to-make-python-wait
        node_id = kwargs.pop('node_id', None)


        imageName = kwargs.get('imageName', "new.png")

        config = kwargs.get('config', "default")
        extendedConfig = kwargs.get('extendedConfig', {}) # Get extendedConfig
        padding = config["padding"]
        invertMask = config["invertMask"]
        width = config["width"]
        height = config["height"]
        config_node_id = config["node_id"]
        onConfigChanged = config["onConfigChanged"]
        names = config["names"]
        fabricData = kwargs.get("fabricData")

        configChanged = self.configCache != config
        # print(configChanged)
        # print(config)
        # print(self.configCache)


        self.configCache = config
        ui = {
            "test": ("value",),
            "padding": [padding],
            "width": [width],
            "height": [height],
            "config_node_id": [config_node_id],
            "node_id": [node_id],
            "names": names,
            "fabricData": [fabricData],
            "awaited": [self.result],
            "configChanged": [configChanged],
            "onConfigChanged": [onConfigChanged],
        }

        # break and send a message to the gui as if it was "executed" below
        detail = {"output": ui, "node": node_id}
        PromptServer.instance.send_sync("compositor_init", detail)

        imageExists = folder_paths.exists_annotated_filepath(imageName)
        # block when config changed
        if imageName == "new.png" or not imageExists or configChanged:
            # Return ExecutionBlocker for all outputs if blocked
            blocker_result = tuple([ExecutionBlocker(None)] * len(self.RETURN_TYPES))
            return {
                "ui": ui,
                "result": blocker_result
            }
        else: # Only process images if not blocked
            image_path = folder_paths.get_annotated_filepath(imageName)
            i = Image.open(image_path)
            i = ImageOps.exif_transpose(i)
            if i.mode == 'I':
                i = i.point(lambda i: i * (1 / 255))
            image = i.convert("RGB")
            image = np.array(image).astype(np.float32) / 255.0
            image = torch.from_numpy(image)[None, ]

            # --- Image Rotation Logic ---
            rotated_images = [None] * 8
            rotated_masks = [None] * 8  # Array to hold transformed masks
            canvas_width = 512  # Default canvas width
            canvas_height = 512  # Default canvas height
            
            try:
                fabric_data_parsed = json.loads(fabricData)
                # Get canvas dimensions from fabric data if available
                canvas_width = int(fabric_data_parsed.get("width", 512))
                canvas_height = int(fabric_data_parsed.get("height", 512))
                print(f"Canvas dimensions: {canvas_width}x{canvas_height}")
                
                # Get both transforms and bboxes arrays
                fabric_transforms = fabric_data_parsed.get('transforms', [])
                fabric_bboxes = fabric_data_parsed.get('bboxes', [])
                
                # Make sure we have valid arrays
                if not fabric_transforms:
                    fabric_transforms = [{} for _ in range(8)]
                if not fabric_bboxes:
                    fabric_bboxes = [{} for _ in range(8)]

                for idx in range(8):
                    image_key = f"image{idx + 1}"
                    mask_key = f"mask{idx + 1}"
                    original_image_tensor = extendedConfig.get(image_key)
                    original_mask_tensor = extendedConfig.get(mask_key)  # Get mask if available

                    if original_image_tensor is not None and idx < len(fabric_transforms):
                        # Get transformation data for rotation and scaling
                        transform = fabric_transforms[idx]
                        angle = transform.get('angle', 0)
                        scale_x = transform.get('scaleX', 1.0)
                        scale_y = transform.get('scaleY', 1.0)
                        
                        # Get positioning data from bboxes (these are the actual coordinates to use)
                        bbox = fabric_bboxes[idx] if idx < len(fabric_bboxes) else {'left': 0, 'top': 0}
                        left = bbox.get('left', 0)
                        top = bbox.get('top', 0)
                        
                        print(f"Processing image {idx+1}: angle={angle}, position=({left},{top}), scale=({scale_x},{scale_y})")
                        if original_mask_tensor is not None:
                            print(f"   - Mask found for image {idx+1}")

                        # First rotate if needed
                        if angle != 0:
                            try:
                                pil_image = tensor2pil(original_image_tensor)
                                rotated_pil = pil_image.rotate(-angle, expand=True, resample=Image.Resampling.BILINEAR)
                                rotated_tensor = pil2tensor(rotated_pil)
                                
                                # Handle mask rotation if mask exists
                                rotated_mask_tensor = None
                                if original_mask_tensor is not None:
                                    pil_mask = tensor2pil(original_mask_tensor)
                                    rotated_pil_mask = pil_mask.rotate(-angle, expand=True, resample=Image.Resampling.BILINEAR)
                                    rotated_mask_tensor = pil2tensor(rotated_pil_mask)
                                
                                # Place the rotated image and mask on canvas using bbox position
                                positioned_tensor, positioned_mask = place_on_canvas(
                                    rotated_tensor, 
                                    canvas_width, 
                                    canvas_height,
                                    left, 
                                    top,
                                    scale_x,
                                    scale_y,
                                    rotated_mask_tensor
                                )
                                rotated_images[idx] = positioned_tensor
                                rotated_masks[idx] = positioned_mask
                            except Exception as e:
                                print(f"Error processing image {idx+1}: {e}")
                                # Fallback - place the original image using bbox position
                                positioned_tensor, positioned_mask = place_on_canvas(
                                    original_image_tensor,
                                    canvas_width,
                                    canvas_height,
                                    left,
                                    top,
                                    scale_x,
                                    scale_y,
                                    original_mask_tensor
                                )
                                rotated_images[idx] = positioned_tensor
                                rotated_masks[idx] = positioned_mask
                        else:
                            # No rotation needed, just position and scale using bbox position
                            positioned_tensor, positioned_mask = place_on_canvas(
                                original_image_tensor,
                                canvas_width,
                                canvas_height,
                                left,
                                top,
                                scale_x,
                                scale_y,
                                original_mask_tensor
                            )
                            rotated_images[idx] = positioned_tensor
                            rotated_masks[idx] = positioned_mask
                    elif original_image_tensor is not None:
                        # No transform data, just use the original
                        rotated_images[idx] = original_image_tensor
                        rotated_masks[idx] = extendedConfig.get(mask_key)  # Use original mask if available

            except json.JSONDecodeError:
                print("Error parsing fabricData JSON. Skipping image positioning.")
                # If JSON fails, just pass original images if they exist
                for idx in range(8):
                    image_key = f"image{idx + 1}"
                    mask_key = f"mask{idx + 1}"
                    rotated_images[idx] = extendedConfig.get(image_key)
                    rotated_masks[idx] = extendedConfig.get(mask_key)
            except Exception as e:
                print(f"An unexpected error occurred during image processing: {e}")
                # Fallback in case of other errors
                for idx in range(8):
                    image_key = f"image{idx + 1}"
                    mask_key = f"mask{idx + 1}"
                    rotated_images[idx] = extendedConfig.get(image_key)
                    rotated_masks[idx] = extendedConfig.get(mask_key)


            return {
                "ui": ui,
                "result": (fabricData, image, *rotated_images, *rotated_masks) # Return transforms, composite image, 8 rotated images, and 8 masks
            }