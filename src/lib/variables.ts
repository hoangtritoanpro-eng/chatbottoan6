export interface Variable {
  name: string;
  defaultValue: string;
  fullMatch: string;
  startIndex?: number;
  endIndex?: number;
}

/**
 * Parses all variable patterns from prompt content:
 * 1. ${variable:default} or ${variable}
 * 2. {{variable}} or {{ variable }}
 * 3. [VARIABLE_NAME] (e.g. [PROMPT], [TARGET LANGUAGE], [CHỦ ĐỀ], [TOPIC])
 * 4. <variable> (e.g. <topic>, <code_snippet>)
 */
export function parseVariables(content: string): Variable[] {
  if (!content) return [];
  const variables: Variable[] = [];
  const seenMatches = new Set<string>();

  // 1. ${variablename:defaultvalue} or ${variablename}
  const dollarRegex = /\$\{([^:}]+)(?::([^}]*))?\}/g;
  let match: RegExpExecArray | null;
  while ((match = dollarRegex.exec(content)) !== null) {
    if (!seenMatches.has(match[0])) {
      seenMatches.add(match[0]);
      variables.push({
        name: match[1].trim(),
        defaultValue: (match[2] ?? "").trim(),
        fullMatch: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  // 2. {{variable}} or {{ variable }}
  const mustacheRegex = /\{\{\s*([a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9\s-]+?)\s*\}\}/g;
  while ((match = mustacheRegex.exec(content)) !== null) {
    if (!seenMatches.has(match[0])) {
      seenMatches.add(match[0]);
      variables.push({
        name: match[1].trim(),
        defaultValue: "",
        fullMatch: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  // 3. [VARIABLE_NAME] (e.g. [PROMPT], [TARGET LANGUAGE], [YOUR_TOPIC])
  const bracketRegex = /\[([A-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9\s-]{2,40})\](?!\()/g;
  while ((match = bracketRegex.exec(content)) !== null) {
    const rawName = match[1].trim();
    if (!seenMatches.has(match[0]) && !["NOTE", "TIP", "WARNING", "CAUTION", "IMPORTANT", "TODO"].includes(rawName.toUpperCase())) {
      seenMatches.add(match[0]);
      variables.push({
        name: rawName,
        defaultValue: "",
        fullMatch: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  // 4. <variable> (e.g. <your_input>, <topic>)
  const angleRegex = /<([a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9\s-]{2,40})>(?![^<]*>)/g;
  const htmlTags = ["br", "hr", "p", "div", "span", "a", "b", "i", "u", "strong", "em", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "code", "pre", "table", "tr", "td", "th"];
  while ((match = angleRegex.exec(content)) !== null) {
    const rawName = match[1].trim();
    if (!htmlTags.includes(rawName.toLowerCase()) && !seenMatches.has(match[0])) {
      seenMatches.add(match[0]);
      variables.push({
        name: rawName,
        defaultValue: "",
        fullMatch: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  return variables;
}

/**
 * Returns unique variable definitions (combining duplicates)
 */
export function getUniqueVariables(variables: Variable[]): { name: string; defaultValue: string }[] {
  const seen = new Map<string, string>();
  for (const variable of variables) {
    if (!seen.has(variable.name)) {
      seen.set(variable.name, variable.defaultValue);
    }
  }
  return Array.from(seen.entries()).map(([name, defaultValue]) => ({ name, defaultValue }));
}

/**
 * Checks if content contains any variable patterns
 */
export function hasVariables(content: string): boolean {
  if (!content) return false;
  return parseVariables(content).length > 0;
}
