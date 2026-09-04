/**
 * Export pipeline for the rendered diagram.
 *
 * The rasterizer draws the SVG through an <img>, which runs in an isolated
 * document: it cannot see the page's @font-face rules and cannot fetch any
 * subresource. Anything the exported image needs must therefore be embedded
 * in the SVG string first — hence inlineFonts() and inlineImages().
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

// Family used for every label mermaid renders (see ThePreview's mermaid config).
const DIAGRAM_FONT_FAMILY = 'DM Mono';

// Header metrics, mirroring the .metadata-layer styles in ThePreview.
const HEADER = {
    eyebrow: { font: '500 11px "DM Mono", monospace', letterSpacing: '1.1px', line: 16 },
    title: { font: '700 28px "DM Mono", monospace', letterSpacing: '-0.56px', line: 40 },
    badge: { font: '400 10px "DM Mono", monospace', letterSpacing: '0.5px', height: 20, padH: 10, gap: 6, marginTop: 8 },
    gap: 4,
    belowHeader: 36,
};

export interface ExportOptions {
    bgColor: string;
    title: string;
    eyebrow: string;
    badges?: string[];
    theme: any;
}

/**
 * Parse an SVG string into an element, tolerating HTML-serialized markup
 * (unclosed <br>, missing xhtml namespace) that the strict XML parser rejects.
 * A rejected parse silently truncates the diagram, so fall back to the HTML
 * parser and re-serialize as well-formed XML.
 */
export const parseSvg = (svgString: string): SVGSVGElement | null => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(svgString, 'image/svg+xml');
    if (!xmlDoc.querySelector('parsererror')) {
        const el = xmlDoc.querySelector('svg');
        if (el) return el as unknown as SVGSVGElement;
    }

    const htmlDoc = parser.parseFromString(svgString, 'text/html');
    const htmlSvg = htmlDoc.querySelector('svg');
    if (!htmlSvg) return null;

    const reparsed = parser.parseFromString(
        new XMLSerializer().serializeToString(htmlSvg),
        'image/svg+xml'
    );
    if (reparsed.querySelector('parsererror')) return null;
    return reparsed.querySelector('svg') as unknown as SVGSVGElement | null;
};

const toDataUrl = (blob: Blob, mime: string): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob.type ? blob : new Blob([blob], { type: mime }));
    });

/**
 * Collect the diagram font's @font-face rules as CSS with the font files
 * embedded as data URLs. Cached: the files never change within a session.
 */
let fontCssPromise: Promise<string> | null = null;

const buildFontCss = async (): Promise<string> => {
    // Same-origin sheets only; cross-origin ones throw on .cssRules access.
    const faces = new Map<string, { weight: string; style: string; unicodeRange: string }>();

    for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList | undefined;
        try {
            rules = sheet.cssRules;
        } catch {
            continue;
        }
        for (const rule of Array.from(rules || [])) {
            if (!(rule instanceof CSSFontFaceRule)) continue;
            const family = rule.style.fontFamily.replace(/["']/g, '').trim();
            if (family !== DIAGRAM_FONT_FAMILY) continue;
            if (rule.style.fontStyle === 'italic') continue;

            const url = rule.style.src.match(/url\(["']?([^"')]+)["']?\)/)?.[1];
            if (!url || faces.has(url)) continue;
            faces.set(url, {
                weight: rule.style.fontWeight || '400',
                style: rule.style.fontStyle || 'normal',
                unicodeRange: rule.style.unicodeRange || '',
            });
        }
    }

    const blocks = await Promise.all(
        Array.from(faces).map(async ([url, face]) => {
            try {
                const response = await fetch(url);
                if (!response.ok) return '';
                const dataUrl = await toDataUrl(await response.blob(), 'font/woff2');
                return `@font-face{font-family:"${DIAGRAM_FONT_FAMILY}";font-style:${face.style};` +
                    `font-weight:${face.weight};src:url(${dataUrl}) format("woff2");` +
                    (face.unicodeRange ? `unicode-range:${face.unicodeRange};` : '') + '}';
            } catch {
                return '';
            }
        })
    );

    return blocks.join('');
};

const inlineFonts = async (svgEl: SVGSVGElement) => {
    fontCssPromise ??= buildFontCss();
    const css = await fontCssPromise;
    if (!css) return;

    const style = svgEl.ownerDocument.createElementNS(SVG_NS, 'style');
    style.textContent = css;
    svgEl.insertBefore(style, svgEl.firstChild);
};

/** Replace referenced images with data URLs; the rasterizer cannot fetch them. */
const inlineImages = async (svgEl: SVGSVGElement) => {
    const targets: { el: Element; attr: string; url: string }[] = [];

    for (const el of Array.from(svgEl.querySelectorAll('img'))) {
        const url = el.getAttribute('src');
        if (url && !url.startsWith('data:')) targets.push({ el, attr: 'src', url });
    }
    for (const el of Array.from(svgEl.querySelectorAll('image'))) {
        const attr = el.hasAttribute('href') ? 'href' : 'xlink:href';
        const url = el.getAttribute('href') || el.getAttribute('xlink:href');
        if (url && !url.startsWith('data:')) targets.push({ el, attr, url });
    }

    await Promise.all(
        targets.map(async ({ el, attr, url }) => {
            try {
                const response = await fetch(url, { mode: 'cors' });
                if (!response.ok) return;
                const dataUrl = await toDataUrl(await response.blob(), 'image/png');
                if (attr === 'xlink:href') {
                    el.setAttributeNS('http://www.w3.org/1999/xlink', 'href', dataUrl);
                } else {
                    el.setAttribute(attr, dataUrl);
                }
            } catch {
                // Unreachable or CORS-blocked: the image is dropped from the
                // export rather than failing the whole render.
                console.warn('Export: could not inline image', url);
            }
        })
    );
};

const loadImage = (src: string): Promise<HTMLImageElement | null> =>
    new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });

const setFont = (ctx: CanvasRenderingContext2D, font: string, letterSpacing: string) => {
    ctx.font = font;
    // Not supported everywhere; ignored where missing.
    if ('letterSpacing' in ctx) (ctx as any).letterSpacing = letterSpacing;
};

const badgeColors = (theme: any, index: number) =>
    index === 0
        ? theme?.badge1 ?? { bg: 'transparent', border: 'transparent', text: '#fff' }
        : theme?.badge2 ?? { bg: 'transparent', border: 'transparent', text: '#fff' };

/** Convert the rendered diagram into a PNG, composed with its header card. */
export const svgToPngBlob = async (svgString: string, opts: ExportOptions): Promise<Blob | null> => {
    const svgEl = parseSvg(svgString);
    if (!svgEl) {
        console.error('Export failed: could not parse the rendered SVG.');
        return null;
    }

    await Promise.all([inlineFonts(svgEl), inlineImages(svgEl)]);

    const viewBox = svgEl.getAttribute('viewBox');
    let svgWidth = 800;
    let svgHeight = 600;
    if (viewBox) {
        const parts = viewBox.split(/[\s,]+/).map(Number);
        if (parts.length === 4) {
            svgWidth = parts[2] || svgWidth;
            svgHeight = parts[3] || svgHeight;
        }
    }

    svgEl.setAttribute('width', `${svgWidth}px`);
    svgEl.setAttribute('height', `${svgHeight}px`);
    svgEl.removeAttribute('style');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const badges = (opts.badges ?? []).filter((b) => b.trim());
    const padding = 60;

    // --- Measure the header so its height adapts to what it actually holds ---
    let headerWidth = 0;
    let headerHeight = 0;

    if (opts.eyebrow) {
        setFont(ctx, HEADER.eyebrow.font, HEADER.eyebrow.letterSpacing);
        headerWidth = Math.max(headerWidth, ctx.measureText(opts.eyebrow.toUpperCase()).width);
        headerHeight += HEADER.eyebrow.line + HEADER.gap;
    }
    if (opts.title) {
        setFont(ctx, HEADER.title.font, HEADER.title.letterSpacing);
        headerWidth = Math.max(headerWidth, ctx.measureText(opts.title).width);
        headerHeight += HEADER.title.line;
    }

    setFont(ctx, HEADER.badge.font, HEADER.badge.letterSpacing);
    const badgeWidths = badges.map((b) => ctx.measureText(b).width + HEADER.badge.padH * 2);
    if (badges.length) {
        const row = badgeWidths.reduce((a, b) => a + b, 0) + HEADER.badge.gap * (badges.length - 1);
        headerWidth = Math.max(headerWidth, row);
        headerHeight += HEADER.badge.marginTop + HEADER.badge.height;
    }

    const watermarkText = 'Made with graphlet.xyz';
    setFont(ctx, '400 12px "DM Mono", monospace', 'normal');
    const watermarkWidth = ctx.measureText(watermarkText).width;

    const topPadding = padding + headerHeight + (headerHeight ? HEADER.belowHeader : 0);
    const bottomPadding = padding * 1.5;
    const totalWidth = Math.max(svgWidth, headerWidth, watermarkWidth + 100) + padding * 2;
    const totalHeight = svgHeight + topPadding + bottomPadding;

    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svgEl));
    const img = await loadImage(url);
    if (!img) {
        console.error('Export failed: the rendered SVG could not be rasterized.');
        return null;
    }

    const scale = 2; // Retina
    canvas.width = totalWidth * scale;
    canvas.height = totalHeight * scale;
    ctx.scale(scale, scale);

    if (opts.bgColor !== 'transparent') {
        ctx.fillStyle = opts.bgColor;
        ctx.fillRect(0, 0, totalWidth, totalHeight);
    }

    // --- Header ---
    ctx.textBaseline = 'top';
    let y = padding;

    if (opts.eyebrow) {
        setFont(ctx, HEADER.eyebrow.font, HEADER.eyebrow.letterSpacing);
        ctx.fillStyle = opts.theme?.header?.eyebrow || 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(opts.eyebrow.toUpperCase(), padding, y);
        y += HEADER.eyebrow.line + HEADER.gap;
    }

    if (opts.title) {
        setFont(ctx, HEADER.title.font, HEADER.title.letterSpacing);
        ctx.fillStyle = opts.theme?.header?.title || '#ffffff';
        ctx.fillText(opts.title, padding, y);
        y += HEADER.title.line;
    }

    if (badges.length) {
        y += HEADER.badge.marginTop;
        setFont(ctx, HEADER.badge.font, HEADER.badge.letterSpacing);
        let x = padding;
        badges.forEach((badge, i) => {
            const width = badgeWidths[i]!;
            const colors = badgeColors(opts.theme, i);
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(x, y, width, HEADER.badge.height, HEADER.badge.height / 2);
            } else {
                ctx.rect(x, y, width, HEADER.badge.height);
            }
            ctx.fillStyle = colors.bg;
            ctx.fill();
            ctx.strokeStyle = colors.border;
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = colors.text;
            ctx.textBaseline = 'middle';
            ctx.fillText(badge, x + HEADER.badge.padH, y + HEADER.badge.height / 2);
            ctx.textBaseline = 'top';
            x += width + HEADER.badge.gap;
        });
    }

    // --- Diagram ---
    ctx.drawImage(img, padding, topPadding, svgWidth, svgHeight);

    // --- Watermark ---
    ctx.save();
    setFont(ctx, '400 12px "DM Mono", monospace', 'normal');
    ctx.globalAlpha = 0.4;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = opts.theme?.header?.eyebrow || '#ffffff';
    ctx.fillText(watermarkText, totalWidth - padding / 2, totalHeight - padding / 2);
    ctx.restore();

    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
};

/** The standalone .svg download needs its fonts and images embedded too. */
export const buildStandaloneSvg = async (svgString: string): Promise<string> => {
    const svgEl = parseSvg(svgString);
    if (!svgEl) return svgString;
    await Promise.all([inlineFonts(svgEl), inlineImages(svgEl)]);
    return new XMLSerializer().serializeToString(svgEl);
};
