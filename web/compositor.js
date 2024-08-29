// author: erosdiffusionai@gmail.com
import {app} from "../../scripts/app.js";
import {api} from "../../scripts/api.js";

import {fabric} from "./fabric.js";


const COMPOSITOR = Symbol();
const TEST_IMAGE_2 = "./extensions/ComfyUI-enricos-nodes/empty.png"

var stuff = {
    shared:
        {
            canvas: null,
            // image1: null,
            // image2: null,
            // image3: null,
            // image4: null,
            safeAreaBorder: null,
        }
}


app.registerExtension({
    name: "Comfy.Compositor",
    getCustomWidgets(app) {
        return {
            COMPOSITOR(node, inputName) {
                let res;
                node[COMPOSITOR] = new Promise((resolve) => (res = resolve));

                const container = document.createElement("div");
                container.style.background = "rgba(0,0,0,0.25)";
                container.style.textAlign = "center";

                const canvas = document.createElement("canvas");
                canvas.id = 'ccanvas';
                canvas.style = 'outline:1px solid red';
                //node.resizable = false;

                container.appendChild(canvas);
                return {widget: node.addDOMWidget(inputName, "COMPOSITOR", container, {ccanvas: canvas})};
            },
        };
    },
    async setup(app) {
        // need to have a unique node key
        // and leverage theImage.cacheKey if it's the same image, do nothing
        function addOrReplace(theImage, index) {

            if (stuff.shared['image' + (index + 1)] == null) {
                stuff.shared['image' + (index + 1)] = theImage;
                stuff.shared.canvas.add(theImage);
                console.log("add or replace", index + 1, "isNull");
            }

            if (stuff.shared['image' + (index + 1)] != null) {

                const oldTransform = {
                    left: stuff.shared['image' + (index + 1)].left,
                    top: stuff.shared['image' + (index + 1)].top,
                    scaleX: stuff.shared['image' + (index + 1)].scaleX,
                    scaleY: stuff.shared['image' + (index + 1)].scaleY,
                    angle: stuff.shared['image' + (index + 1)].angle,
                    flipX: stuff.shared['image' + (index + 1)].flipX,
                    flipY: stuff.shared['image' + (index + 1)].flipY,
                    originX: stuff.shared['image' + (index + 1)].originX,
                    originY: stuff.shared['image' + (index + 1)].originY,
                };

                //Remove the old image from the canvas
                stuff.shared.canvas.remove(stuff.shared['image' + (index + 1)]);
                theImage.set(oldTransform);
                stuff.shared.canvas.add(theImage);
                stuff.shared['image' + (index + 1)] = theImage;
            }
            stuff.shared.canvas.bringToFront(stuff.shared.safeAreaBorder)
        }

        function imageMessageHandler(event) {
            // base 64 content of the image
            const images = [...event.detail.names]

            images.map((b64, index) => {
                console.log(b64);
                fabric.Image.fromURL(b64, function (oImg) {
                    addOrReplace(oImg, index);
                });
                // stuff.shared.canvas.renderAll();
            });
        }

        api.addEventListener("compositor.images", imageMessageHandler);
    },
    loadedGraphNode(node, app) {
        node.type == "Compositor" && console.log(node, node["stuff"]["shared"]);

        const ns = node.stuff.shared;
        ns.safeArea.setHeight(ns.h.value);
        ns.safeArea.setWidth(ns.w.value);
        ns.safeArea.setLeft(ns.p.value);
        ns.safeArea.setTop(ns.p.value);

        ns.safeAreaBorder.setHeight(ns.h.value + 2);
        ns.safeAreaBorder.setWidth(ns.w.value + 2);
        ns.safeAreaBorder.setLeft(ns.p.value - 1);
        ns.safeAreaBorder.setTop(ns.p.value - 1);
        ns.safeAreaBorder.set("strokeWidth", 1);
        ns.safeAreaBorder.set("stroke", "#00b300b0");
        ns.safeAreaBorder.bringToFront()

        ns.canvas.bringToFront(ns.safeAreaBorder);

        //console.log(v.getWidth(), v.getHeight(), value);
        ns.v.setHeight(ns.safeArea.getHeight() + (ns.p.value * 2));
        ns.v.setWidth(ns.safeArea.getWidth() + (ns.p.value * 2));
        ns.v.renderAll();
        ns.node.setSize([ns.v.getWidth() + 100, ns.v.getHeight() + 556]);
        ns.capture();

    },
    nodeCreated(node) {
        if ((node.type, node.constructor.comfyClass !== "Compositor")) return;

        function dataURLToBlob(dataURL) {
            const parts = dataURL.split(',');
            const mime = parts[0].match(/:(.*?);/)[1];
            const binary = atob(parts[1]);
            const array = [];
            for (let i = 0; i < binary.length; i++) {
                array.push(binary.charCodeAt(i));
            }
            return new Blob([new Uint8Array(array)], {type: mime});
        }

        const camera = node.widgets.find((w) => w.name === "image");
        const w = node.widgets.find((w) => w.name === "width");
        const h = node.widgets.find((w) => w.name === "height");
        const p = node.widgets.find((w) => w.name === "padding");
        const captureOnQueue = node.widgets.find((w) => w.name === "capture_on_queue");

        const v = new fabric.Canvas('ccanvas', {
            backgroundColor: 'transparent',
            selectionColor: 'transparent',
            selectionLineWidth: 1,
            // F-10 preserve object stacking
            preserveObjectStacking: true,
        });


        // the actual area of WxH with the composition
        var safeArea = new fabric.Rect({
            left: p.value,
            top: p.value,
            fill: 'rgba(0,0,0,0.2)',
            width: w.value,
            height: h.value,
            selectable: false,
        });

        var safeAreaBorder = new fabric.Rect({
            left: p.value - 1,
            top: p.value - 1,
            fill: 'rgba(0,0,0,0.0)',
            width: w.value + 1,
            height: h.value + 1,
            selectable: false,
        });

        stuff.shared.safeAreaBorder = safeAreaBorder;

        v.add(safeArea);
        v.add(safeAreaBorder);
        v.bringToFront(safeAreaBorder);

        w.origCalback = w.callback;
        w.callback = (value, graphCanvas, node, pos, event) => {
            //w.origCalback(value, graphCanvas, node, pos, event);
            v.setWidth(value + (p.value * 2));
            safeArea.setWidth(value);
            safeAreaBorder.setWidth(value);
            v.renderAll();
            node.setSize([v.getWidth() + 100, v.getHeight() + 556])
            //node.setSize({value+20,node.size[1]});
        }

        h.origCalback = h.callback;
        h.callback = (value, graphCanvas, node, pos, event) => {
            //h.origCalback(value, graphCanvas, node, pos, event);
            v.setHeight(value + (p.value * 2));
            safeArea.setHeight(value);
            safeAreaBorder.setHeight(value + 2);
            v.renderAll();
            node.setSize([v.getWidth() + 100, v.getHeight() + 556])
        }

        // padding change
        p.origCalback = p.callback;
        p.callback = (value, graphCanvas, node, pos, event) => {
            //p.origCalback(value, graphCanvas, node, pos, event);

            safeArea.setHeight(h.value);
            safeArea.setWidth(w.value);
            safeArea.setLeft(value);
            safeArea.setTop(value);

            safeAreaBorder.setHeight(h.value + 2);
            safeAreaBorder.setWidth(w.value + 2);
            safeAreaBorder.setLeft(value - 1);
            safeAreaBorder.setTop(value - 1);


            //console.log(v.getWidth(), v.getHeight(), value);
            v.setHeight(safeArea.getHeight() + (value * 2));
            v.setWidth(safeArea.getWidth() + (value * 2));
            v.renderAll();
            node.setSize([v.getWidth() + 100, v.getHeight() + 556])
        }

        /** the fabric canvas:v */
        stuff.shared.canvas = v;

        // final image to be associated to the node preview
        const img = new Image();


        // data url
        let data = null;
        const capture = () => {

            data = v.toDataURL({
                format: 'jpeg',
                quality: 0.8,
                left: p.value,
                top: p.value,
                width: w.value,
                height: h.value
            });


            //debugger;
            img.onload = () => {
                node.imgs = [img];
                app.graph.setDirtyCanvas(true);
                requestAnimationFrame(() => {
                    node.setSizeForImage?.();
                });
            };

            img.src = data;
        };
        capture();

        // grab some references in the node. hopefully they are not serialized :D
        node.stuff.shared = {
            p: p,
            w: w,
            h: h,
            /** the fabric canvas:v */
            v: v,
            camera: camera,
            i: img,
            safeArea: safeArea,
            safeAreaBorder: safeAreaBorder,
            capture: capture,
        }

        const btn = node.addWidget("button", "capture", "capture", capture);

        btn.serializeValue = () => undefined;
        // camera is the input node widget that's mapped to the output, in practice we are pretending we
        // gave the composite as input
        camera.serializeValue = async () => {
            // we can simply return a path, of an ideally uploaded file and be happy with it
            try {
                if (captureOnQueue.value) {
                    capture();
                } else if (!node.imgs?.length) {
                    const err = `Composition not saved`;
                    throw new Error(err);
                }
                // remove selection if any
                v.discardActiveObject().renderAll();

                const blob = dataURLToBlob(data)
                // const blob = await new Promise((r) => canv.toBlob(r));
                // const blob = await new Promise((r) => safeArea.toBlob(r));

                // Upload image to temp storage
                const name = `${+new Date()}.png`;
                const file = new File([blob], name);
                const body = new FormData();
                body.append("image", file);
                body.append("subfolder", "compositor");
                body.append("type", "temp");
                const resp = await api.fetchApi("/upload/image", {
                    method: "POST",
                    body,
                });
                if (resp.status !== 200) {
                    const err = `Error uploading composition image: ${resp.status} - ${resp.statusText}`;
                    throw new Error(err);
                }
                return `compositor/${name} [temp]`;
            } catch (e) {
                // we have nothing so...well..just pretend
                return TEST_IMAGE_2;
            }

        };
    },
});
