/** Shared destination for contact messages and role-request notifications. */
export const ADMIN_INBOX = 'drrmh.upm@up.edu.ph';

export function escapeEmailHtml(value: string): string {
    return value.replace(
        /[&<>"']/g,
        (character) =>
            ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
            })[character]!
    );
}
