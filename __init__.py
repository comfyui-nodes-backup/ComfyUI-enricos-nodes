# author: erosdiffusionai@gmail.com
from .Compositor3 import Compositor3
from .CompositorConfig3 import CompositorConfig3
from .CompositorTools3 import CompositorTools3
from .CompositorTransformsOut3 import CompositorTransformsOutV3
from .CompositorMasksOutputV3 import CompositorMasksOutputV3
from .CompositorColorPicker import CompositorColorPicker

NODE_CLASS_MAPPINGS = {
    "Compositor3": Compositor3,
    "CompositorConfig3": CompositorConfig3,
    "CompositorTools3": CompositorTools3,
    "CompositorTransformsOutV3": CompositorTransformsOutV3,
    "CompositorMasksOutputV3": CompositorMasksOutputV3,
    "CompositorColorPicker": CompositorColorPicker,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "Compositor3": "💜 Compositor (V3)",
    "CompositorConfig3": "💜 Compositor Config (V3)",
    "CompositorTools3": "💜 Compositor Tools (V3) Experimental",
    "CompositorTransformsOutV3": "💜 Compositor Transforms Output (V3)",
    "CompositorMasksOutputV3": "💜 Compositor Masks Output (V3)",
    "CompositorColorPicker": "💜 Compositor Color Picker",
}

EXTENSION_NAME = "Enrico"

WEB_DIRECTORY = "./web"
