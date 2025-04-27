import torch
from PIL import Image
import numpy as np

class CompositorMasksOutputV3:
    """
    This node unpacks the COMPOSITOR_OUTPUT_MASKS from Compositor3 into individual image and mask outputs.
    Makes the Compositor's interface cleaner by separating the layer outputs into a dedicated node.
    """
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "layer_outputs": ("COMPOSITOR_OUTPUT_MASKS",),
            },
        }

    RETURN_TYPES = ("IMAGE", "IMAGE", "IMAGE", "IMAGE", "IMAGE", "IMAGE", "IMAGE", "IMAGE",
                   "MASK", "MASK", "MASK", "MASK", "MASK", "MASK", "MASK", "MASK")
    RETURN_NAMES = ("image_1", "image_2", "image_3", "image_4", 
                    "image_5", "image_6", "image_7", "image_8",
                    "mask_1", "mask_2", "mask_3", "mask_4", 
                    "mask_5", "mask_6", "mask_7", "mask_8")
    FUNCTION = "unpack_outputs"
    CATEGORY = "image"

    def unpack_outputs(self, layer_outputs):
        """
        Unpacks the layer_outputs dictionary into individual image and mask outputs.
        
        Args:
            layer_outputs: Dictionary containing 'images', 'masks', 'canvas_width', and 'canvas_height'
            
        Returns:
            Tuple of 16 tensors: 8 images and 8 masks in order
        """
        images = layer_outputs.get("images", [None] * 8)
        masks = layer_outputs.get("masks", [None] * 8)
        
        # Get canvas dimensions for creating empty images/masks if needed
        canvas_width = layer_outputs.get("canvas_width", 512)
        canvas_height = layer_outputs.get("canvas_height", 512)
        
        # Create a standard empty black image for missing values
        def create_empty_image(width, height):
            empty_img = Image.new('RGB', (width, height), (0, 0, 0))
            img_np = np.array(empty_img).astype(np.float32) / 255.0
            return torch.from_numpy(img_np)[None, ]
        
        # Create a standard empty mask (black) for missing values
        def create_empty_mask(width, height):
            empty_mask = Image.new('L', (width, height), 0)  # Black mask (completely masked)
            mask_np = np.array(empty_mask).astype(np.float32) / 255.0
            return torch.from_numpy(mask_np)[None, ]
        
        # Ensure we have 8 images and masks
        result_images = []
        result_masks = []
        
        for i in range(8):
            # Handle images
            if i < len(images) and images[i] is not None:
                result_images.append(images[i])
            else:
                result_images.append(create_empty_image(canvas_width, canvas_height))
            
            # Handle masks
            if i < len(masks) and masks[i] is not None:
                result_masks.append(masks[i])
            else:
                result_masks.append(create_empty_mask(canvas_width, canvas_height))
        
        # Return all images and masks as a flat tuple
        return (*result_images, *result_masks)