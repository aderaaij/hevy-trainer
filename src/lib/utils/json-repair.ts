/**
 * Utilities for repairing malformed JSON from AI responses
 */

export function attemptJsonRepair(jsonString: string): string {
  let repaired = jsonString;

  // Remove any text before the first { or [
  const firstBrace = repaired.indexOf('{');
  const firstBracket = repaired.indexOf('[');
  const start = Math.min(
    firstBrace >= 0 ? firstBrace : Infinity,
    firstBracket >= 0 ? firstBracket : Infinity
  );
  if (start > 0 && start < Infinity) {
    repaired = repaired.slice(start);
  }

  // Remove any text after the last } or ]
  const lastBrace = repaired.lastIndexOf('}');
  const lastBracket = repaired.lastIndexOf(']');
  const end = Math.max(lastBrace, lastBracket);
  if (end > 0 && end < repaired.length - 1) {
    repaired = repaired.slice(0, end + 1);
  }

  // Fix common issues
  repaired = repaired
    // Replace single quotes with double quotes
    .replace(/'/g, '"')
    // Remove trailing commas before } or ]
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
    // Fix unescaped quotes inside strings (basic attempt)
    .replace(/"([^"]*)"([^:,}\]]*)"([^"]*)":/g, '"$1\\"$2\\"$3":')
    // Remove comments
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Fix missing commas between properties (basic)
    .replace(/}\s*{/g, '},{')
    .replace(/]\s*\[/g, '],[')
    .replace(/":\s*"([^"]+)"\s*"([^"]+)":/g, '": "$1", "$2":')
    .replace(/":\s*(\d+)\s*"([^"]+)":/g, '": $1, "$2":')
    .replace(/":\s*(\w+)\s*"([^"]+)":/g, '": $1, "$2":');

  return repaired;
}

export function tryParseJson<T>(
  jsonString: string,
  options?: {
    attemptRepair?: boolean;
    logErrors?: boolean;
  }
): { success: true; data: T } | { success: false; error: string; raw?: string } {
  const { attemptRepair = true, logErrors = true } = options || {};

  // First attempt: parse as-is
  try {
    const data = JSON.parse(jsonString) as T;
    return { success: true, data };
  } catch (firstError) {
    if (!attemptRepair) {
      return {
        success: false,
        error: firstError instanceof Error ? firstError.message : 'Unknown parse error',
        raw: jsonString
      };
    }

    // Second attempt: try to repair
    try {
      const repaired = attemptJsonRepair(jsonString);
      const data = JSON.parse(repaired) as T;
      if (logErrors) {
        console.warn('JSON was repaired successfully');
      }
      return { success: true, data };
    } catch (secondError) {
      if (logErrors) {
        console.error('Failed to parse JSON even after repair attempt');
        console.error('Original error:', firstError);
        console.error('Repair error:', secondError);
      }
      return {
        success: false,
        error: secondError instanceof Error ? secondError.message : 'Unknown parse error',
        raw: jsonString
      };
    }
  }
}

export function extractJsonFromText(text: string): string | null {
  // Try to find JSON object or array in the text
  const patterns = [
    /```json\s*([\s\S]*?)\s*```/,
    /```\s*([\s\S]*?)\s*```/,
    /({[\s\S]*})/,
    /(\[[\s\S]*\])/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}