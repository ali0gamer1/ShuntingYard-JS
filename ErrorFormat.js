


export function formatErrorLocation(message, token, expression = "")
{

        if (!token || !token.location || token.location.startIndex == null || !expression)
        {
            return message;
        }

        const start = token.location.startIndex;
        const end = (token.location.endIndex != null && token.location.endIndex >= start)
            ? token.location.endIndex
            : start;

        const radius = 12;
        const contextStart = Math.max(0, start - radius);
        const contextEnd = Math.min(expression.length - 1, end + radius);

        const before = expression.slice(contextStart, start);
        const errorText = expression.slice(start, end + 1);
        const after = expression.slice(end + 1, contextEnd + 1);

        const prefixEllipsis = contextStart > 0 ? "..." : "";
        const suffixEllipsis = contextEnd < expression.length - 1 ? "..." : "";

        const snippet = `${prefixEllipsis}${before}${errorText}${after}${suffixEllipsis}`;
        const caretPadding = " ".repeat(prefixEllipsis.length + before.length);
        const caret = "^".repeat(end - start + 1);

        const positionLabel = start === end ? `position ${start}` : `positions ${start}-${end}`;

        return `${message} (at ${positionLabel})\n  ${snippet}\n  ${caretPadding}${caret}`;
}

export function raiseError(message, token, expression = "")
{
    throw new Error(formatErrorLocation(message, token, expression));
}