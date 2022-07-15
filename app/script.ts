const OBFSCUSED_CHARS = [..."▀▁▂▃▄▅▆▇█▉▊▋▌▍▎▏▐▔▕▖▗▘▙▚▛▜▝▞▟"];

interface Cut {
  start?: number;
  end?: number;
}

function measureTextWidth(text: string, element: Element): number {
  const canvas = document.createElement("canvas");
  canvas.style.font = getComputedStyle(element).font;
  return canvas.getContext("2d")!.measureText(text).width;
}

function obfuscateText(text: string, cut: Cut = {}): string {
  console.debug({ text, cut });
  return [...text]
    .map((char, i) => {
      if (i < (cut.start ?? 0)) {
        return char;
      }
      if (i >= (cut.end ?? text.length)) {
        return char;
      }
      if (/^\s+$/.test(char)) {
        return char;
      }
      return OBFSCUSED_CHARS[
        Math.floor(Math.random() * OBFSCUSED_CHARS.length)
      ];
    })
    .join("");
}

function obfuscateNode(node: Node, cut?: Cut) {
  if (node.nodeType === node.TEXT_NODE) {
    node.textContent = obfuscateText(node.textContent ?? "", cut);
  } else {
    [...node.childNodes].forEach((child) => {
      obfuscateNode(child);
    });
  }
}

function obfuscateRange(selection: Selection, range: Range) {
  const it = document.createNodeIterator(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT
  );

  for (let node = it.nextNode(); node; node = it.nextNode()) {
    if (!selection.containsNode(node, true)) {
      continue;
    }
    let start, end: number | undefined;
    if (node === range.startContainer) {
      start = range.startOffset;
    }
    if (node === range.endContainer) {
      end = range.endOffset;
    }
    obfuscateNode(node, { start, end });
  }
}

function obfuscateSelection(selection: Selection) {
  for (let i = 0; i < selection.rangeCount; i++) {
    obfuscateRange(selection, selection.getRangeAt(i));
  }
}

const selection = document.getSelection();
if (selection && selection.isCollapsed === false) {
  obfuscateSelection(selection);
} else {
  obfuscateNode(document.body);
}
