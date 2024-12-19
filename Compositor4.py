import folder_paths
from PIL import Image, ImageOps
import numpy as np
import torch
from comfy_execution.graph import ExecutionBlocker
# import threading
from server import PromptServer
from aiohttp import web



routes = PromptServer.instance.routes


@routes.post('/compositor4/done')
async def receivedDone(request):
    return web.json_response({})


class Compositor4:
    file = "new.png"
    result = None
    configCache = None

    def extract_parameters(self, kwargs):
        node_id = kwargs.pop('node_id', None)

        imageName = kwargs.get('composite', "new.png")

        config = kwargs.get('config', "default")
        padding = config["padding"]
        invertMask = config["invertMask"]
        width = config["width"]
        height = config["height"]
        config_node_id = config["node_id"]
        onConfigChanged = config["onConfigChanged"]
        names = config["names"]
        preset = config["preset"]
        fabricData = kwargs.get("fabricData")

        configChanged = self.configCache != config

        return node_id, imageName, config, padding, invertMask, width, height, config_node_id, onConfigChanged, names, preset, fabricData, configChanged

    def check_lazy_status(self, **kwargs):
        print("check_lazy_status")
        node_id, imageName, config, padding, invertMask, width, height, config_node_id, onConfigChanged, names, preset, fabricData, configChanged = self.extract_parameters(kwargs)
        print(configChanged)
        self.configCache = config
        needed = []
        if(configChanged):

            #needed.append("stop")
            #print("config has changed",needed);

            ui = {
                "composite": ("value",),
                "padding": [padding],
                "width": [width],
                "height": [height],
                "config_node_id": [config_node_id],
                "node_id": [node_id],
                "names": names,
                "fabricData": [fabricData],
                "preset": [preset],
                # "awaited": [self.result],
                "configChanged": [configChanged],
                "onConfigChanged": [onConfigChanged],
                "stop":[True],
                # seed/initiaized
                #preset
            }

            # break and send a message to the gui as if it was "executed" below
            detail = {"output": ui, "node": node_id}
            PromptServer.instance.send_sync("compositor_config_changed", detail)


            #from comfy.model_management import InterruptProcessingException
            #raise InterruptProcessingException()

        return needed

    # @classmethod
    # def IS_CHANGED(cls, **kwargs):
    #     fabricData = kwargs.get("fabricData")
    #     # print(fabricData)
    #     return fabricData

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "config": ("COMPOSITOR_CONFIG", {"forceInput": True}),
                #"fabricData": ("STRING", {"default": "{}"}),
                #"imageName": ("STRING", {"default": "new.png"}),
                "composite": "STRING",

            },
            "optional": {
                #     "stop": ("STRING",{"lazy":True}),
                "tools": ("BOOLEAN", {"forceInput": True, "default": True}),
            },
            "hidden": {
                "extra_pnginfo": "EXTRA_PNGINFO",
                "node_id": "UNIQUE_ID",
                


            },
        }

    RETURN_TYPES = ( "IMAGE","STRING")
    RETURN_NAMES = ( "image","transforms")
    FUNCTION = "composite"
    CATEGORY = "image"
    # OUTPUT_NODE  = True

    def composite(self, **kwargs):
        print("composite")
        node_id, imageName, config, padding, invertMask, width, height, config_node_id, onConfigChanged, names, preset, fabricData, configChanged = self.extract_parameters(kwargs)
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
            "preset": [preset],
            "awaited": [self.result],
            "configChanged": [configChanged],
            "onConfigChanged": [onConfigChanged],
        }

        # break and send a message to the gui as if it was "executed" below
        # detail = {"output": ui, "node": node_id}
        # PromptServer.instance.send_sync("compositor_init", detail)

        imageExists = folder_paths.exists_annotated_filepath(imageName)
        # block when config changed
        # if imageName == "new.png" or not imageExists or configChanged:
        if not imageExists or configChanged:
        #     return {
        #         "ui": ui,
        #         "result": (ExecutionBlocker(None), ExecutionBlocker(None))
        #     }
            print("does not exist")
            imageName = "new.png"

        image_path = folder_paths.get_annotated_filepath(imageName)
        # copy the image at imageName to the output folder filename imageName
        #shutil.copyfile(image_path, folder_paths.get_output_filepath(imageName))

        i = Image.open(image_path)
        i = ImageOps.exif_transpose(i)
        if i.mode == 'I':
            i = i.point(lambda i: i * (1 / 255))
        image = i.convert("RGB")
        image = np.array(image).astype(np.float32) / 255.0
        image = torch.from_numpy(image)[None,]

        return {
            "ui": ui,
            "result": (image,fabricData)
        }
