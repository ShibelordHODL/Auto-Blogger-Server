
import * as sanitizeHtml from 'sanitize-html'


const sanitizeConfigs: Object = {
    allowedTags: [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'blockquote',
        'p',
        // 'a',
        'ul',
        'ol',
        'nl',
        'li',
        'b',
        'i',
        'strong',
        'em',
        'strike',
        'code',
        'hr',
        'br',
        'table',
        'thead',
        'caption',
        'tbody',
        'tr',
        'th',
        'td',
        'pre',
        // 'title',
        'img',
        // 'html',
        // 'head',
        // 'meta',
        // 'body',
        'figure',
        // 'article',
        // 'link',
        // 'nav',
        // 'span',
        // 'div'


    ],
    allowedAttributes: {
        a: ['href', 'name', 'target', 'rel'],
        // We don't currently allow img itself by default, but this
        // would make sense if we did
        img: ['src', 'alt'],
        meta: ['*'],
        // link: ['*'],
        article: ['*'],
        figure: ['*'],
        // span: ['class'],
        // div: ['class']
    },
    // Lots of these won't come up by default because we don't allow them
    // selfClosing: ['br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta'],
    // URL schemes we permit
    allowedSchemes: ['http', 'https', 'ftp', 'mailto'],
    allowedSchemesByTag: {},
    allowProtocolRelative: true,
};

export function cleanPageHTML(d) {
    // var sanitizeHtml = require('sanitize-html');
    const c = sanitizeHtml(d, (sanitizeConfigs));
    return c;
}