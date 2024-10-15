import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

import Init from "./init.js";

const COMPOSITOR = Symbol();

/** check if this is a Compositor3 node */
function isCompositor4(node) {
  return node.constructor.comfyClass == "Compositor4";
}

function isCompositorConfig4(node) {
  return node.constructor.comfyClass == "CompositorConfig4";
}

function getCompositorWidget(node, widgetName) {
  return node.widgets.find((w) => w.name === widgetName);
}

app.registerExtension({
  name: "Comfy.Compositor4",

//   async getCustomWidgets(app) {
//     return {
//         async COMPOSITOR(node, inputName, inputData, app) {
            
//             const container = document.createElement("div");
//             await this.initEditor(container);

//             /**
//              * NOTE: hideOnZoom:false FIXES not being able to take screenshot and disappearing on zoom out
//              * but creates some inconsistencies as lines get too small to be rendered properly
//              */
//             return {widget: node.addDOMWidget(inputName, "COMPOSITOR4", container, {hideOnZoom: false})};
//         },
//     };
// },

  async setup(app) {
    function executingMessageHandler(event) {}

    function executedMessageHandler(event, a, b) {}

    function configureHandler() {}

    function executionStartHandler() {}

    function executionCachedHandler() {}

    function graphChangedHandler() {}

    function changeWorkflowHandler() {}

    api.addEventListener("compositor_init", executedMessageHandler);
    api.addEventListener("graphChanged", graphChangedHandler);
    api.addEventListener("change_workflow", changeWorkflowHandler);
    api.addEventListener("execution_start", executionStartHandler);
    api.addEventListener("execution_cached", executionCachedHandler);
    api.addEventListener("executing", executingMessageHandler);
    /** when a node returns an ui element */
    api.addEventListener("executed", executedMessageHandler);
    api.addEventListener("configure", configureHandler);
  },

  async init(args) {
    // console.log("init", args)
  },

  async beforeRegisterNodeDef(nodeType, nodeData, app) {},

  async loadedGraphNode(node, app) {
    //  console.log("loadedGraphNode");
  },
  async afterConfigureGraph(args) {},

  async nodeCreated(node) {
    if (!isCompositor4(node)) return;

    //const el =  this.init();
    const el = document.createElement("div");
    el.style.backgroundColor = "transparent";
    el.width = 800;
    el.height = 600;
    el.id="compositor4container";
    
    
    
    
    
    node.editorWidget = node.addDOMWidget("test", "test", el, {
      serialize: false,
      hideOnZoom: false,
    });
    

    const init = new Init();
    const compositor = await init.initEditor(el);
    console.log("compositor", compositor);
    node.setSize(compositor.getWidgetDimensions());

    node.setDirtyCanvas(true, true);
  }



  
});




