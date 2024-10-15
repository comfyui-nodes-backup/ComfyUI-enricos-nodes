import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";
import Compositor4 from "./compositor4.js";
import { fabric } from "./fabric.js";
import  {PREFERENCES, addCompositorPreferences, getPreferences} from "./compositor4preferences.js";
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

    addCompositorPreferences(PREFERENCES);

    function executingMessageHandler(event) {}

    async function executedMessageHandler(event, a, b) {
      const node = app.graph.getNodeById(event.detail.node);
      if(!isCompositor4(node)) return;
      console.log("executedMessageHandler", event, a, b);
      console.log(event.detail, node);

      const init = new Init();
      const preferences = getPreferences()
      const editor = await init.initEditor(node._el, preferences, event.detail.config, event.detail.images);
      console.log("editor", editor);
      node.setSize(editor.getWidgetDimensions());

      node.setDirtyCanvas(true, true);
    }

    function configureHandler() {}

    function executionStartHandler() {}

    function executionCachedHandler() {}

    function graphChangedHandler() {}

    function changeWorkflowHandler() {}

    api.addEventListener("compositor_init", executedMessageHandler);
    api.addEventListener("compositor_config_changed", executedMessageHandler);
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
    el.id = "compositor4container";
    el.value = "foobar.jpg";

    //const imageNameWidget = getCompositorWidget(node, "imageName");
    node._el = el;
    node.editorWidget = node.addDOMWidget("composite", "composite", el, {
      serialize: true,
      hideOnZoom: false,
      resizable: false,

      getValue() {
        
        return el.value;
      },
      setValue(v2) {        
        el.value = v2;
      },
    });

    // const originalSerializeValue = node.editorWidget.serializeValue;
    // node.editorWidget.serializeValue = (e) => {
    //   console.log("serializeValue",e);
    //   //return el.value;
    // };

    //const init = new Init();
    //const preferences = getPreferences()
    //const editor = await init.initEditor(el, preferences);
    //console.log("editor", editor);
    //node.setSize(editor.getWidgetDimensions());

    //node.setDirtyCanvas(true, true);
  },
});
