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
    .map((char, i) => {
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

function obfuscateTextNode(node: Node, cut?: Cut) {
  console.debug("obfuscateTextNode", { node, cut });
  if (node.nodeType !== node.TEXT_NODE) {
    throw new Error("node is not a text node");
  }

  const nodeText = node.textContent;
  if (!nodeText) {
    return;
  }
  const [pre, text, post] = cutText(nodeText, cut);
  let obfuscatedText = obfuscateText(text);

  const originalWidth = measureTextWidth(text, node.parentElement!);
  const obfuscatedWidth = measureTextWidth(obfuscatedText, node.parentElement!);

  console.debug({ originalWidth, obfuscatedWidth });

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

function textNodesFromRange(range: Range): Node[] {
  let results = <Node[]>[];
  let node: Node | null = range.startContainer;
  while (node) {
    let atEnd: boolean = false;
    if (node.nodeType === node.TEXT_NODE) {
      results.push(node);
      atEnd = node === range.endContainer;
    } else if (node.nodeType === node.ELEMENT_NODE) {
      const visit = (node: Node): boolean => {
        if (node.nodeType === node.TEXT_NODE) {
          results.push(node);
        } else if (node.nodeType === node.ELEMENT_NODE) {
          const { start, end } = nodeCutFromRange(range, node);
          const atEnd = [...node.childNodes].slice(start, end).some((child) => {
            return visit(child);
          });
          if (atEnd) return true;
        }
        return node === range.endContainer;
      };
      atEnd = visit(node);
    }

    if (atEnd) {
      return results;
    }

    while (!node.nextSibling) {
      node = node.parentElement;
      if (!node || node === range.commonAncestorContainer) {
        return results;
      }
    }
    node = node?.nextSibling;
  }
  return results;
}

const selection = document.getSelection();
if (selection && selection.isCollapsed === false) {
  for (let i = 0; i < selection.rangeCount; i++) {
    const range = selection.getRangeAt(i);
    textNodesFromRange(range).forEach((node) => {
      obfuscateTextNode(node, nodeCutFromRange(range, node));
    });
  }
} else {
  const it = document.createNodeIterator(document.body, NodeFilter.SHOW_TEXT);
  for (let node = it.nextNode(); node; node = it.nextNode()) {
    obfuscateTextNode(node);
  }
}
