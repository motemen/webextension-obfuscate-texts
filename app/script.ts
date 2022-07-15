const OBFSCUSED_CHARS = [..."▀▁▂▃▄▅▆▇█▉▊▋▌▍▎▏▐▔▕▖▗▘▙▚▛▜▝▞▟"];

interface Cut {
  start?: number;
  end?: number;
}

let canvas: HTMLCanvasElement | undefined;
function measureTextWidth(text: string, element: Element): number {
  if (!canvas) {
    canvas = document.createElement("canvas");
  }
  canvas.style.font = getComputedStyle(element).font;
  return canvas.getContext("2d")!.measureText(text).width;
}

const ZERO_WIDTH_SPACE = "\u200B";

function obfuscateText(text: string): string {
  return [...text]
    .map((char) => {
      if (/^\s+$/.test(char)) {
        return char;
      }
      return (
        OBFSCUSED_CHARS[Math.floor(Math.random() * OBFSCUSED_CHARS.length)] +
        ZERO_WIDTH_SPACE
      );
    })
    .join("");
}

function cutText(text: string, cut?: Cut): [string, string, string] {
  const start = cut?.start ?? 0;
  const end = cut?.end ?? text.length;

  return [
    text.substring(0, start),
    text.substring(start, end),
    text.substring(end),
  ];
}

const PRINTED_ATTRIBUTES = ["alt", "placeholder"];

function obfuscateNode(node: Node, cut?: Cut) {
  if (!node.parentElement?.offsetParent) {
    // node is not visible eg. <script>, <style>
    return;
  }

  if (node.nodeType !== node.TEXT_NODE) {
    if (node instanceof HTMLElement) {
      PRINTED_ATTRIBUTES.forEach((attr) => {
        if (node.hasAttribute(attr)) {
          node.setAttribute(attr, obfuscateText(node.getAttribute(attr) ?? ""));
        }
      });
    }
    return;
  }

  const nodeText = node.textContent;
  if (!nodeText) {
    return;
  }

  const [pre, text, post] = cutText(nodeText, cut);
  let obfuscatedText = obfuscateText(text);

  const [originalWidth, obfuscatedWidth] = [
    measureTextWidth(text, node.parentElement!),
    measureTextWidth(obfuscatedText, node.parentElement!),
  ];

  if (obfuscatedWidth > originalWidth) {
    obfuscatedText = obfuscatedText.substring(
      0,
      (obfuscatedText.length * originalWidth) / obfuscatedWidth
    );
  }

  node.textContent = `${pre}${obfuscatedText}${post}`;
}

function nodeCutFromRange(range: Range, node: Node): Cut {
  const start = range.startContainer === node ? range.startOffset : undefined;
  const end = range.endContainer === node ? range.endOffset : undefined;
  return { start, end };
}

function visitNodesInsideRange(range: Range, callback: (node: Node) => void) {
  let node: Node | null = range.startContainer;

  const visit = (node: Node): boolean => {
    callback(node);

    const { start, end } = nodeCutFromRange(range, node);
    const atEnd = [...node.childNodes]
      .slice(start, end)
      .some((child) => visit(child));
    if (atEnd) {
      return true;
    }

    return node === range.endContainer;
  };

  while (node) {
    const atEnd = visit(node);
    if (atEnd) {
      return;
    }

    while (!node.nextSibling) {
      node = node.parentElement;
      if (!node || node === range.commonAncestorContainer) {
        return;
      }
    }
    node = node?.nextSibling;
  }
}

const selection = document.getSelection();
if (selection && selection.isCollapsed === false) {
  for (let i = 0; i < selection.rangeCount; i++) {
    const range = selection.getRangeAt(i);
    visitNodesInsideRange(range, (node) => {
      obfuscateNode(node, nodeCutFromRange(range, node));
    });
  }
} else {
  const it = document.createNodeIterator(
    document.body,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT
  );
  for (let node = it.nextNode(); node; node = it.nextNode()) {
    obfuscateNode(node);
  }
}
