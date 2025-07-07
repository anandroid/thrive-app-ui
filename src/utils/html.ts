/**
 * Strip HTML tags from a string
 */
export function stripHtml(html: string): string {
  // Create a temporary div element to parse HTML
  if (typeof window !== 'undefined') {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
  
  // Fallback for server-side rendering
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Extract text content from HTML strings in an array
 */
export function extractTextFromHtmlArray(htmlArray: string[]): string[] {
  return htmlArray.map(html => stripHtml(html));
}