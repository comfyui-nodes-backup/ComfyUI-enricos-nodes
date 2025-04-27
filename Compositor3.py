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

    # Updated RETURN_TYPES and RETURN_NAMES
    RETURN_TYPES = ("STRING", "IMAGE", "IMAGE", "IMAGE", "IMAGE", "IMAGE", "IMAGE", "IMAGE", "IMAGE", "IMAGE")
    RETURN_NAMES = ("transforms", "image", "image_out_1", "image_out_2", "image_out_3", "image_out_4", "image_out_5", "image_out_6", "image_out_7", "image_out_8")
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
            try:
                fabric_data_parsed = json.loads(fabricData)
                print(f"fabric data {fabricData}") # Print the angle
                # Use the 'transforms' list instead of 'objects'
                fabric_transforms = fabric_data_parsed.get('transforms', [])

                for idx in range(8):
                    image_key = f"image{idx + 1}"
                    original_image_tensor = extendedConfig.get(image_key)

                    # Check if index is within bounds of fabric_transforms
                    if original_image_tensor is not None and idx < len(fabric_transforms):
                        fabric_transform = fabric_transforms[idx]
                        angle = fabric_transform.get('angle', 0)
                        print(f"Rotating image {idx+1} by angle: {angle}") # Print the angle

                        if angle != 0: # Only rotate if angle is not 0
                            try:
                                # Convert tensor to PIL
                                pil_image = tensor2pil(original_image_tensor)
                                # Rotate PIL image (negative angle for consistency with Fabric.js?)
                                # Use BILINEAR resampling for better quality
                                rotated_pil = pil_image.rotate(-angle, expand=True, resample=Image.Resampling.BILINEAR)
                                # Convert back to tensor
                                rotated_tensor = pil2tensor(rotated_pil)
                                rotated_images[idx] = rotated_tensor
                            except Exception as e:
                                print(f"Error rotating image {idx+1}: {e}")
                                rotated_images[idx] = original_image_tensor # Fallback to original on error
                        else:
                             rotated_images[idx] = original_image_tensor # Keep original if no rotation
                    elif original_image_tensor is not None:
                         rotated_images[idx] = original_image_tensor # Keep original if no fabric data for it

            except json.JSONDecodeError:
                print("Error parsing fabricData JSON. Skipping rotation.")
                # If JSON fails, just pass original images if they exist
                for idx in range(8):
                    image_key = f"image{idx + 1}"
                    rotated_images[idx] = extendedConfig.get(image_key)
            except Exception as e:
                 print(f"An unexpected error occurred during rotation processing: {e}")
                 # Fallback in case of other errors
                 for idx in range(8):
                    image_key = f"image{idx + 1}"
                    rotated_images[idx] = extendedConfig.get(image_key)


            return {
                "ui": ui,
                "result": (fabricData, image, *rotated_images) # Return transforms, composite image, and 8 rotated images
            }