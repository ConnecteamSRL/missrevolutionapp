import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  ImageStyle,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import RenderHTML, {
  CustomBlockRenderer,
  DomVisitorCallbacks,
  MixedStyleDeclaration,
  MixedStyleRecord,
  useInternalRenderer,
} from 'react-native-render-html';
import ImageViewing from 'react-native-image-viewing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GraphitFonts } from '@/src/theme';
import {
  CONTENT_TEXT_SIZE_MULTIPLIERS,
  useContentTextSizeStore,
} from '@/src/store/contentTextSizeStore';

type Props = {
  html: string | null | undefined;
  contentWidth?: number;
  selectable?: boolean;
  onOpenUrl?: (url: string) => void;
  // Applies the persisted text-size multiplier (contentTextSizeStore) to the
  // textual styles. Opt-in per surface: only the workout/diet/recipe cards
  // enable it; everything else (e.g. privacy policy) stays at multiplier 1.
  scalableText?: boolean;
  // Content images become tappable and open in a fullscreen pinch-to-zoom
  // viewer. Opt-in per surface, same as `scalableText`.
  enableImageViewer?: boolean;
};

// Contract with the backoffice editor: staff spaces content with empty
// paragraphs (<p></p> / <p>&nbsp;</p>), which the editor shows as a full
// line (20px line-height + 10px paragraph margin). The transient render
// engine keeps empty <p> as zero-height blocks, so on the phone they would
// only yield the 10px margin. To stay WYSIWYG, each internal empty line is
// converted into a fixed-height spacer (sized via classesStyles below);
// leading/trailing empty lines are trimmed instead, so cards don't render
// dangling blank space.
const emptyParagraph = '<p>(?:\\s|&nbsp;)*</p>';
const leadingEmptyParagraphs = new RegExp(`^(?:\\s*${emptyParagraph})+`, 'i');
const trailingEmptyParagraphs = new RegExp(`(?:${emptyParagraph}\\s*)+$`, 'i');
const innerEmptyParagraphs = new RegExp(emptyParagraph, 'gi');

const normalizeHtml = (html: string) => {
  return (html ?? '')
    .trim()
    .replace(leadingEmptyParagraphs, '')
    .replace(trailingEmptyParagraphs, '')
    .replace(innerEmptyParagraphs, '<div class="content-spacer"></div>')
    .trim();
};

// Ordered list of <img> sources, extracted straight from the (normalized)
// html string: simple and deterministic, and the order matches the render
// order so the viewer can open on the tapped image.
const imgSrcAttribute = /<img[^>]*\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

// htmlparser2 decodes entities in attribute values (tnode.attributes.src),
// while the raw html string keeps them encoded: decode the common ones so the
// two representations match.
const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

const extractImageSources = (html: string): string[] => {
  const sources: string[] = [];
  for (const match of html.matchAll(imgSrcAttribute)) {
    const src = decodeHtmlEntities(match[1] ?? match[2] ?? '').trim();
    if (src) sources.push(src);
  }
  return sources;
};

// Staff often compose content by pasting from Word/Google Docs/PDF, which
// carries hard-coded inline `color`/`background-color` (dark or even white
// text, white backgrounds). The render engine applies them verbatim, so the
// text looks black, or disappears on the pink card. We keep only the brand
// pink (#ED5192) — the single color the backoffice editor offers — and drop
// every other inline color/background; the text then falls back to the clean
// app default (#1F1F1F). See also the matching paste cleanup in the backoffice
// editor (editor-config.util.ts).
const BRAND_PINK = '#ed5192';
const isBrandPinkColor = (value: string): boolean => {
  const v = value.trim().toLowerCase().replace(/\s+/g, '');
  return (
    v === BRAND_PINK ||
    v === `${BRAND_PINK}ff` ||
    v === 'rgb(237,81,146)' ||
    v === 'rgba(237,81,146,1)'
  );
};
const sanitizeInlineStyle = (style: string): string =>
  style
    .split(';')
    .map((decl): string | null => {
      const i = decl.indexOf(':');
      if (i === -1) return null;
      const prop = decl.slice(0, i).trim().toLowerCase();
      const value = decl.slice(i + 1).trim();
      if (!prop || !value) return null;
      if (prop === 'background' || prop === 'background-color') return null;
      if (prop === 'color' && !isBrandPinkColor(value)) return null;
      return `${prop}: ${value}`;
    })
    .filter((decl): decl is string => decl !== null)
    .join('; ');

// react-native-render-html 6.x resolves inline `style` colors at parse time, and
// mutating attribs.style from domVisitors does NOT reliably take effect — so
// pasted dark colors kept rendering black. We strip them from the HTML STRING
// before RenderHTML ever parses it: parser-independent and guaranteed. Keeps the
// brand pink (handled by sanitizeInlineStyle), drops every other color/background
// and legacy <font color>/<font bgcolor>.
const stripPastedColorsFromHtml = (html: string): string =>
  html
    .replace(/style=("|')([\s\S]*?)\1/gi, (_m, q: string, body: string) => {
      const cleaned = sanitizeInlineStyle(body);
      return cleaned ? `style=${q}${cleaned}${q}` : '';
    })
    .replace(/(<font\b[^>]*?)\s+color=("|')[\s\S]*?\2/gi, '$1')
    .replace(/(<font\b[^>]*?)\s+bgcolor=("|')[\s\S]*?\2/gi, '$1');

const domVisitors: DomVisitorCallbacks = {
  onElement(element) {
    // Legacy content: images without an explicit width keep filling the card.
    if (element.tagName === 'img' && !element.attribs.width) {
      element.attribs.width = '100%';
    }
    // Strip foreign inline colors/backgrounds coming from pasted content.
    if (element.attribs?.style) {
      const cleaned = sanitizeInlineStyle(element.attribs.style);
      if (cleaned) element.attribs.style = cleaned;
      else delete element.attribs.style;
    }
    // Legacy <font color>/<font bgcolor> from old pastes.
    if (element.tagName === 'font') {
      delete element.attribs.color;
      delete element.attribs.bgcolor;
    }
  },
};

// Contract with the backoffice editor: <img align="left|right"> aligns the
// image; attribute absent (or any other value) means centered, which matches
// the legacy behavior of tagsStyles.img.
const resolveImgAlignSelf = (align: string | undefined): ImageStyle['alignSelf'] => {
  if (align === 'left') return 'flex-start';
  if (align === 'right') return 'flex-end';
  return 'center';
};

// Module-level context so ImgRenderer can stay a referentially stable
// constant (see `renderers` below) while still reaching the per-instance
// image-viewer callback provided by HtmlContent.
type ImagePressContextValue = {
  enabled: boolean;
  onPress: (src: string) => void;
};

const ImagePressContext = createContext<ImagePressContextValue>({
  enabled: false,
  onPress: () => {},
});

// Reuses the internal img renderer (IMGElement) so the experimental percent
// width path, max-width computation and loading/error states stay untouched.
// The per-node alignSelf is appended after the tnode style, so it overrides
// the default alignSelf coming from tagsStyles.img. IMGElement strips
// width/height from the container style and resolves dimensions from the
// width attribute + style.width only, so adding alignSelf cannot interfere.
//
// Image tap (viewer): IMGElementProps already supports `onPress` — when set,
// IMGElementContainer swaps its View for GenericPressable with the very same
// container style (alignSelf/width handling untouched), so no manual wrapper
// is needed.
const ImgRenderer: CustomBlockRenderer = function ImgRenderer(props) {
  const { Renderer, rendererProps } = useInternalRenderer('img', props);
  const { enabled, onPress } = useContext(ImagePressContext);
  const alignSelf = resolveImgAlignSelf(props.tnode.attributes.align);
  const style = useMemo(
    () => [rendererProps.style, { alignSelf } as ImageStyle],
    [rendererProps.style, alignSelf],
  );
  const src = props.tnode.attributes.src ?? '';
  const alt = props.tnode.attributes.alt;
  const pressable = enabled && !!src;
  const handlePress = useCallback(() => onPress(src), [onPress, src]);
  const containerProps = useMemo(
    () =>
      pressable
        ? {
            ...rendererProps.containerProps,
            accessibilityRole: 'imagebutton' as const,
            accessibilityLabel: alt || 'Immagine',
          }
        : rendererProps.containerProps,
    [pressable, rendererProps.containerProps, alt],
  );
  return (
    <Renderer
      {...rendererProps}
      containerProps={containerProps}
      onPress={pressable ? handlePress : undefined}
      style={style}
    />
  );
};

// Module-level constant: RenderHTML rebuilds its render registry whenever the
// `renderers` reference changes, so this object must be referentially stable.
const renderers = { img: ImgRenderer };

export default function HtmlContent({
  html,
  contentWidth,
  selectable = false,
  onOpenUrl,
  scalableText = false,
  enableImageViewer = false,
}: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const cw = contentWidth ?? width;

  const level = useContentTextSizeStore((s) => s.level);
  const multiplier = scalableText ? CONTENT_TEXT_SIZE_MULTIPLIERS[level] : 1;

  const source = useMemo(
    () => ({ html: stripPastedColorsFromHtml(normalizeHtml(html ?? '')) }),
    [html],
  );

  const [viewer, setViewer] = useState({ visible: false, index: 0 });

  const imageSources = useMemo(
    () => (enableImageViewer ? extractImageSources(source.html) : []),
    [enableImageViewer, source.html],
  );

  const viewerImages = useMemo(() => imageSources.map((uri) => ({ uri })), [imageSources]);

  const imagePressValue = useMemo<ImagePressContextValue>(
    () => ({
      enabled: enableImageViewer && imageSources.length > 0,
      onPress: (src: string) => {
        setViewer({ visible: true, index: Math.max(0, imageSources.indexOf(src)) });
      },
    }),
    [enableImageViewer, imageSources],
  );

  const closeViewer = useCallback(() => {
    setViewer((prev) => ({ ...prev, visible: false }));
  }, []);

  const systemFonts = useMemo(
    () => [
      GraphitFonts.GraphitRegular,
      GraphitFonts.GraphitMedium,
      GraphitFonts.GraphitBold,
      'System',
    ],
    [],
  );

  // tagsStyles/classesStyles are memoized on [multiplier, cw]: RenderHTML
  // rebuilds its engine when these references change, which is accepted here
  // because the text-size level changes rarely (explicit user tap). All the
  // textual font sizes, line heights and vertical block margins scale
  // proportionally; images and hr are intentionally left untouched.
  const tagsStyles = useMemo<MixedStyleRecord>(() => {
    const s = (value: number) => Math.round(value * multiplier);
    // The editor only produces <h3>, but pasted content can carry any heading
    // level: style them all like the brand H3 so they never fall back to plain
    // body text.
    const heading: MixedStyleDeclaration = {
      marginTop: s(8),
      marginBottom: s(10),
      color: '#ED5192',
      fontFamily: GraphitFonts.GraphitBold,
      fontSize: s(24),
      lineHeight: s(24),
    };
    return {
      body: {
        color: '#1F1F1F',
        fontFamily: GraphitFonts.GraphitRegular,
        fontSize: s(14),
        lineHeight: s(20),
      },
      p: {
        marginTop: 0,
        marginBottom: s(10),
        color: '#1F1F1F',
        fontFamily: GraphitFonts.GraphitRegular,
      },
      strong: { fontFamily: GraphitFonts.GraphitBold, color: '#1F1F1F' },
      em: { fontStyle: 'italic', color: '#1F1F1F', fontFamily: GraphitFonts.GraphitRegular },
      i: { fontStyle: 'italic', color: '#1F1F1F', fontFamily: GraphitFonts.GraphitRegular },
      u: { textDecorationLine: 'underline' },
      ul: { marginTop: s(4), marginBottom: s(10), paddingLeft: 18 },
      li: { marginBottom: s(8) },
      a: { color: '#ED5192', textDecorationLine: 'underline' },
      img: {
        maxWidth: cw,
        height: 'auto',
        alignSelf: 'center',
        borderRadius: 14,
        marginTop: 10,
        marginBottom: 6,
      },
      hr: {
        borderColor: '#FFD1E4',
        borderTopWidth: 1,
        marginTop: 10,
        marginBottom: 12,
      },
      h1: heading,
      h2: heading,
      h3: heading,
      h4: heading,
      h5: heading,
      h6: heading,
    };
  }, [multiplier, cw]);

  // One empty editor line: p line-height (20) + p marginBottom (10), both
  // scaled with the same multiplier so spacing stays proportional. marginTop
  // is pinned to 0 so sibling margin collapsing cannot alter the footprint.
  const classesStyles = useMemo<MixedStyleRecord>(
    () => ({
      'content-spacer': {
        height: Math.round(20 * multiplier),
        marginTop: 0,
        marginBottom: Math.round(10 * multiplier),
      },
    }),
    [multiplier],
  );

  return (
    <ImagePressContext.Provider value={imagePressValue}>
      <RenderHTML
        contentWidth={cw}
        source={source}
        systemFonts={systemFonts}
        domVisitors={domVisitors}
        renderers={renderers}
        classesStyles={classesStyles}
        // selectable on Android breaks text layout (no wrapping): see
        // facebook/react-native#48921 and #30684.
        defaultTextProps={{ selectable: Platform.OS === 'ios' ? selectable : false }}
        ignoredDomTags={['script', 'style', 'iframe', 'form', 'input', 'button']}
        tagsStyles={tagsStyles}
        renderersProps={{
          a: {
            onPress: async (_evt: any, href: string) => {
              if (!href) return;
              if (onOpenUrl) return onOpenUrl(href);
              try {
                await Linking.openURL(href);
              } catch (e) {
                console.error('Failed to open url', href, e);
              }
            },
          },
          img: {
            enableExperimentalPercentWidth: true,
          },
        }}
      />

      {enableImageViewer && (
        <ImageViewing
          images={viewerImages}
          imageIndex={viewer.index}
          visible={viewer.visible}
          onRequestClose={closeViewer}
          HeaderComponent={() => (
            <View
              style={[
                styles.viewerHeader,
                {
                  paddingTop: insets.top + 12,
                  paddingLeft: insets.left + 16,
                  paddingRight: insets.right + 16,
                },
              ]}
            >
              <Pressable onPress={closeViewer} hitSlop={12} style={styles.viewerCloseBtn}>
                <Text style={styles.viewerCloseText}>Chiudi</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </ImagePressContext.Provider>
  );
}

const styles = StyleSheet.create({
  viewerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  viewerCloseBtn: {
    backgroundColor: 'rgba(237, 81, 146, 0.4)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  viewerCloseText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: GraphitFonts.GraphitMedium,
  },
});
