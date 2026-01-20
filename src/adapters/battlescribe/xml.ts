export type XmlAttributes = Record<string, string>;

export interface XmlNode {
  name: string;
  attributes: XmlAttributes;
  children: XmlNode[];
  text: string;
}

function decodeXmlEntities(input: string): string {
  return input
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function isWhitespaceOnly(s: string): boolean {
  return s.trim().length === 0;
}

function skipUntil(xml: string, startIdx: number, endMarker: string): number {
  const end = xml.indexOf(endMarker, startIdx);
  return end === -1 ? xml.length : end + endMarker.length;
}

function parseAttributes(attrText: string): XmlAttributes {
  const attrs: XmlAttributes = {};
  let i = 0;

  const n = attrText.length;
  while (i < n) {
    // skip whitespace
    while (i < n && /\s/.test(attrText[i]!)) i++;
    if (i >= n) break;

    // read key
    let key = '';
    while (i < n && /[^\s=]/.test(attrText[i]!)) {
      const ch = attrText[i]!;
      if (ch === '=' || /\s/.test(ch)) break;
      key += ch;
      i++;
    }
    key = key.trim();
    while (i < n && /\s/.test(attrText[i]!)) i++;
    if (i >= n || attrText[i] !== '=') {
      // attribute without value; ignore
      while (i < n && !/\s/.test(attrText[i]!)) i++;
      continue;
    }
    i++; // '='
    while (i < n && /\s/.test(attrText[i]!)) i++;
    if (i >= n) break;

    const quote = attrText[i] === '"' || attrText[i] === "'" ? attrText[i]! : null;
    if (quote) i++;

    let value = '';
    while (i < n) {
      const ch = attrText[i]!;
      if (quote) {
        if (ch === quote) break;
        value += ch;
        i++;
      } else {
        if (/\s/.test(ch)) break;
        value += ch;
        i++;
      }
    }

    if (quote && i < n && attrText[i] === quote) i++;
    if (key) attrs[key] = decodeXmlEntities(value);
  }

  return attrs;
}

/**
 * Minimal, dependency-free XML parser suitable for BattleScribe `.cat/.gst` files.
 * - Ignores comments, XML declarations, and doctypes.
 * - Preserves text on nodes in `text` (trimmed/decoded), but may collapse whitespace.
 */
export function parseXml(xmlInput: string): XmlNode {
  const xml = xmlInput.replace(/^\uFEFF/, ''); // remove BOM if present
  const root: XmlNode = { name: '#document', attributes: {}, children: [], text: '' };
  const stack: XmlNode[] = [root];

  let i = 0;
  while (i < xml.length) {
    const lt = xml.indexOf('<', i);
    if (lt === -1) {
      const tail = xml.slice(i);
      if (!isWhitespaceOnly(tail)) stack[stack.length - 1]!.text += decodeXmlEntities(tail);
      break;
    }

    // text between tags
    if (lt > i) {
      const text = xml.slice(i, lt);
      if (!isWhitespaceOnly(text)) stack[stack.length - 1]!.text += decodeXmlEntities(text);
    }

    // tag handling
    if (xml.startsWith('<!--', lt)) {
      i = skipUntil(xml, lt + 4, '-->');
      continue;
    }
    if (xml.startsWith('<?', lt)) {
      i = skipUntil(xml, lt + 2, '?>');
      continue;
    }
    if (xml.startsWith('<!DOCTYPE', lt) || xml.startsWith('<!doctype', lt)) {
      i = skipUntil(xml, lt + 9, '>');
      continue;
    }
    if (xml.startsWith('<![CDATA[', lt)) {
      const end = xml.indexOf(']]>', lt + 9);
      const cdata = end === -1 ? xml.slice(lt + 9) : xml.slice(lt + 9, end);
      if (!isWhitespaceOnly(cdata)) stack[stack.length - 1]!.text += cdata;
      i = end === -1 ? xml.length : end + 3;
      continue;
    }

    const gt = xml.indexOf('>', lt + 1);
    if (gt === -1) break;

    const rawTag = xml.slice(lt + 1, gt).trim();
    i = gt + 1;

    if (rawTag.startsWith('/')) {
      // end tag
      const name = rawTag.slice(1).trim().split(/\s+/)[0] || '';
      // pop until matching name (defensive)
      for (let s = stack.length - 1; s > 0; s--) {
        if (stack[s]!.name === name) {
          stack.length = s;
          break;
        }
      }
      continue;
    }

    const selfClosing = rawTag.endsWith('/');
    const tagBody = selfClosing ? rawTag.slice(0, -1).trim() : rawTag;

    const spaceIdx = tagBody.search(/\s/);
    const name = (spaceIdx === -1 ? tagBody : tagBody.slice(0, spaceIdx)).trim();
    const attrText = spaceIdx === -1 ? '' : tagBody.slice(spaceIdx).trim();
    const node: XmlNode = {
      name,
      attributes: attrText ? parseAttributes(attrText) : {},
      children: [],
      text: '',
    };

    const parent = stack[stack.length - 1]!;
    parent.children.push(node);

    if (!selfClosing) stack.push(node);
  }

  return root;
}

export function findAll(root: XmlNode, predicate: (n: XmlNode) => boolean): XmlNode[] {
  const out: XmlNode[] = [];
  const stack: XmlNode[] = [root];
  while (stack.length) {
    const n = stack.pop()!;
    if (predicate(n)) out.push(n);
    for (let i = n.children.length - 1; i >= 0; i--) stack.push(n.children[i]!);
  }
  return out;
}

export function firstChild(node: XmlNode, name: string): XmlNode | undefined {
  return node.children.find((c) => c.name === name);
}

export function childText(node: XmlNode, childName: string): string | undefined {
  const c = firstChild(node, childName);
  const t = c?.text?.trim();
  return t ? t : undefined;
}


