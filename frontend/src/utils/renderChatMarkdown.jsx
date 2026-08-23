import { Fragment } from "react";

const escapeSplit = (value) => String(value ?? "");

const renderInlineMarkdown = (text, keyPrefix) => {
  const source = escapeSplit(text);
  const nodes = [];
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_)/g;
  let lastIndex = 0;
  let match;
  let partIndex = 0;

  while ((match = pattern.exec(source)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(source.slice(lastIndex, match.index));
    }

    const boldContent = match[2];
    const italicContent = match[3] || match[4];

    if (boldContent) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${partIndex}`}>{boldContent}</strong>,
      );
    } else if (italicContent) {
      nodes.push(
        <em key={`${keyPrefix}-i-${partIndex}`}>{italicContent}</em>,
      );
    }

    lastIndex = pattern.lastIndex;
    partIndex += 1;
  }

  if (lastIndex < source.length) {
    nodes.push(source.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : source;
};


export const renderChatMarkdown = (text) => {
  const source = escapeSplit(text).replace(/\r\n/g, "\n");
  if (!source.trim()) return null;

  const lines = source.split("\n");
  const blocks = [];
  let listItems = [];
  let blockIndex = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={`list-${blockIndex}`} className="chatMdList">
        {listItems.map((item, index) => (
          <li key={`li-${blockIndex}-${index}`}>{item}</li>
        ))}
      </ul>,
    );
    listItems = [];
    blockIndex += 1;
  };

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const level = Math.min(headingMatch[1].length, 4);
      const HeadingTag = `h${level}`;
      blocks.push(
        <HeadingTag key={`h-${blockIndex}`} className="chatMdHeading">
          {renderInlineMarkdown(headingMatch[2], `h-${lineIndex}`)}
        </HeadingTag>,
      );
      blockIndex += 1;
      return;
    }

    const listMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    if (listMatch) {
      listItems.push(renderInlineMarkdown(listMatch[1], `li-${lineIndex}`));
      return;
    }

    flushList();
    blocks.push(
      <p key={`p-${blockIndex}`} className="chatMdParagraph">
        {renderInlineMarkdown(trimmed, `p-${lineIndex}`)}
      </p>,
    );
    blockIndex += 1;
  });

  flushList();

  return <Fragment>{blocks}</Fragment>;
};
