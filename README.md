# ComfyUI Keep Connected Textareas

A lightweight ComfyUI frontend extension that keeps multiline text widgets
visible after their inputs are connected when using the classic Nodes 1.0
renderer.

连接多行字符串输入后，ComfyUI 的经典 Nodes 1.0 画布通常会隐藏对应文本框。
本扩展会保留文本框，让上游传入的内容区域仍然可见，同时阻止误编辑。

## Features

- Keeps connected multiline textareas visible in Nodes 1.0.
- Leaves workflow data and execution behavior unchanged.
- Adds a `0%–150%` visual-strength control in ComfyUI Settings.
- Includes a live preview that matches the current canvas textarea style.
- Uses opacity from `0%–100%` and brightness from `100%–150%`.
- Supports existing workflows without adding custom workflow nodes.

## Installation

Clone this repository into ComfyUI's `custom_nodes` directory:

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/k888irov-clip/ComfyUI-KeepConnectedTextareas.git
```

Restart ComfyUI, then hard-refresh the browser with `Ctrl + F5`.

## Usage

1. Keep **Nodes 2.0** disabled if you want to use the classic renderer.
2. Connect an upstream value to a multiline string input.
3. Open **Settings → 已连接文本框 → 显示设置**.
4. Adjust **文本框显示强度**. The preview and connected textareas update live.

The default visual strength is `85%`.

## Compatibility

Developed and tested with:

- ComfyUI `0.39.0`
- ComfyUI frontend `1.53.10`
- Classic Nodes 1.0 renderer

The extension targets DOM-based multiline widgets and may also work with
other frontend versions that use the same widget API.

## License

[MIT](LICENSE)
