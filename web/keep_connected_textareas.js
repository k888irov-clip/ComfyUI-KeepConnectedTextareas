import { app } from "../../scripts/app.js";

const PATCHED = Symbol("keep-connected-textarea-patched");
const OPACITY_SETTING_ID = "KeepConnectedTextareas.connectedOpacity";
const DEFAULT_VISUAL_PERCENT = 85;

let connectedVisualPercent = DEFAULT_VISUAL_PERCENT;

function clampVisualPercent(value) {
    const percent = Number(value);
    if (!Number.isFinite(percent)) return DEFAULT_VISUAL_PERCENT;
    return Math.min(150, Math.max(0, percent));
}

function getTextarea(widget) {
    const element = widget?.element ?? widget?.inputEl;
    if (element instanceof HTMLTextAreaElement) return element;
    return element?.querySelector?.("textarea") ?? null;
}

function updateAppearance(widget, textarea) {
    const disabled = Boolean(widget.computedDisabled);
    textarea.disabled = disabled;
    applyVisualStrength(textarea, disabled, connectedVisualPercent);
}

function applyVisualStrength(textarea, disabled, percent) {
    if (!disabled) {
        textarea.style.opacity = "";
        textarea.style.filter = "";
        textarea.style.cursor = "";
        return;
    }

    // CSS opacity stops at 100%. From 100–150%, brightness supplies a
    // meaningful extra-visibility range instead of silently clamping.
    textarea.style.opacity = String(Math.min(percent, 100) / 100);
    textarea.style.filter = percent > 100 ? `brightness(${percent / 100})` : "";
    textarea.style.cursor = "not-allowed";
}

function refreshAllTextareas() {
    for (const node of app.graph?._nodes ?? []) {
        for (const widget of node.widgets ?? []) {
            const textarea = getTextarea(widget);
            if (textarea && widget[PATCHED]) updateAppearance(widget, textarea);
        }
    }
    app.canvas?.setDirty?.(true, true);
}

function copyCanvasTextareaStyle(preview) {
    const textareas = [...document.querySelectorAll("textarea.comfy-multiline-input")]
        .filter((textarea) => !textarea.closest('[role="dialog"]'));
    const source = textareas.find((textarea) => textarea.disabled) ?? textareas[0];
    if (!source) return;

    const style = getComputedStyle(source);
    for (const property of [
        "backgroundColor",
        "color",
        "font",
        "lineHeight",
        "letterSpacing",
        "padding",
        "border",
        "borderRadius",
        "textAlign",
    ]) {
        preview.style[property] = style[property];
    }
}

function createPreviewSetting(name, setter, initialValue) {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const controlCell = document.createElement("td");
    const label = document.createElement("label");
    const controls = document.createElement("div");
    const slider = document.createElement("input");
    const valueLabel = document.createElement("span");
    const previewFrame = document.createElement("div");
    const preview = document.createElement("textarea");

    label.textContent = name;
    nameCell.append(label);

    controls.style.display = "flex";
    controls.style.alignItems = "center";
    controls.style.gap = "10px";

    slider.type = "range";
    slider.min = "0";
    slider.max = "150";
    slider.step = "5";
    slider.style.flex = "1";

    valueLabel.style.minWidth = "48px";
    valueLabel.style.textAlign = "right";

    previewFrame.className = "dom-widget size-full";
    previewFrame.style.width = "100%";
    previewFrame.style.height = "72px";
    previewFrame.style.marginTop = "8px";

    preview.className = "comfy-multiline-input h-full w-full";
    preview.value = "连接后的文本框实时预览\nLoRA 触发词 + 画风与主体提示词";
    preview.disabled = true;
    preview.style.width = "100%";
    preview.style.height = "100%";
    preview.style.boxSizing = "border-box";
    preview.style.resize = "none";
    preview.style.transition = "opacity 80ms linear, filter 80ms linear";
    copyCanvasTextareaStyle(preview);

    const update = (value, persist) => {
        const percent = clampVisualPercent(value);
        connectedVisualPercent = percent;
        slider.value = String(percent);
        valueLabel.textContent = `${percent}%`;
        applyVisualStrength(preview, true, percent);
        refreshAllTextareas();
        if (persist) setter(percent);
    };

    slider.addEventListener("input", (event) => update(event.target.value, true));
    update(initialValue, false);

    controls.append(slider, valueLabel);
    previewFrame.append(preview);
    controlCell.append(controls, previewFrame);
    row.append(nameCell, controlCell);
    return row;
}

function patchWidget(widget) {
    if (!widget || widget[PATCHED]) return;

    const textarea = getTextarea(widget);
    if (!textarea || typeof widget.isVisible !== "function") return;

    const originalIsVisible = widget.isVisible.bind(widget);
    const originalOnDraw = widget.options?.onDraw;

    widget.isVisible = function () {
        if (this.hidden) return false;
        if (this.node?.isWidgetVisible) {
            return this.node.isWidgetVisible(this);
        }
        return originalIsVisible();
    };

    widget.options ??= {};
    widget.options.onDraw = function (...args) {
        originalOnDraw?.apply(this, args);
        updateAppearance(widget, textarea);
    };

    widget[PATCHED] = true;
}

function patchNode(node) {
    for (const widget of node?.widgets ?? []) patchWidget(widget);
}

app.registerExtension({
    name: "KeepConnectedTextareas",

    init() {
        app.ui.settings.addSetting({
            id: OPACITY_SETTING_ID,
            name: "文本框显示强度",
            category: ["已连接文本框", "显示设置", "显示强度"],
            tooltip: "0–100% 调节不透明度，100–150% 继续提高亮度。",
            type: createPreviewSetting,
            defaultValue: DEFAULT_VISUAL_PERCENT,
            onChange(value) {
                connectedVisualPercent = clampVisualPercent(value);
                refreshAllTextareas();
            },
        });
    },

    beforeRegisterNodeDef(nodeType) {
        const originalOnNodeCreated = nodeType.prototype.onNodeCreated;

        nodeType.prototype.onNodeCreated = function (...args) {
            const result = originalOnNodeCreated?.apply(this, args);
            patchNode(this);
            requestAnimationFrame(() => patchNode(this));
            return result;
        };
    },

    nodeCreated(node) {
        patchNode(node);
        requestAnimationFrame(() => patchNode(node));
    },

    loadedGraphNode(node) {
        patchNode(node);
        requestAnimationFrame(() => patchNode(node));
    },
});
