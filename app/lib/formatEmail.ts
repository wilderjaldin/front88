export function formatEmailBody(text: string, mode: "html" | "plain" = "html") {
  if (!text) return "";

  if (mode === "html") {
    return text.replace(/\r?\n/g, "<br/>");
  }

  // modo plain text: normaliza a \r\n
  return text.replace(/\r?\n/g, "\r\n");
}