import React, { useMemo } from 'react';
import { Linking, useWindowDimensions } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { GraphitFonts } from '@/src/theme';

type Props = {
  html: string | null | undefined;
  contentWidth?: number;
  selectable?: boolean;
  onOpenUrl?: (url: string) => void;
};

const normalizeHtml = (html: string) => {
  return (html ?? '')
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/<p>\s*&nbsp;\s*<\/p>/gi, '')
    .trim();
};

export default function HtmlContent({ html, contentWidth, selectable = false, onOpenUrl }: Props) {
  const { width } = useWindowDimensions();

  const cw = contentWidth ?? width;
  const imgMax = Math.min(cw * 0.82, 340);

  const source = useMemo(() => ({ html: normalizeHtml(html ?? '') }), [html]);

  const systemFonts = useMemo(
    () => [
      GraphitFonts.GraphitRegular,
      GraphitFonts.GraphitMedium,
      GraphitFonts.GraphitBold,
      'System',
    ],
    [],
  );

  return (
    <RenderHTML
      contentWidth={cw}
      imagesMaxWidth={imgMax}
      source={source}
      systemFonts={systemFonts}
      defaultTextProps={{ selectable }}
      ignoredDomTags={['script', 'style', 'iframe', 'form', 'input', 'button']}
      tagsStyles={{
        body: {
          color: '#1F1F1F',
          fontFamily: GraphitFonts.GraphitRegular,
          fontSize: 14,
          lineHeight: 20,
        },
        p: {
          marginTop: 0,
          marginBottom: 10,
          color: '#1F1F1F',
          fontFamily: GraphitFonts.GraphitRegular,
        },
        strong: { fontFamily: GraphitFonts.GraphitBold, color: '#1F1F1F' },
        em: { fontStyle: 'italic', color: '#1F1F1F', fontFamily: GraphitFonts.GraphitRegular },
        i: { fontStyle: 'italic', color: '#1F1F1F', fontFamily: GraphitFonts.GraphitRegular },
        u: { textDecorationLine: 'underline' },
        ul: { marginTop: 4, marginBottom: 10, paddingLeft: 18 },
        li: { marginBottom: 8 },
        a: { color: '#ED5192', textDecorationLine: 'underline' },
        img: {
          width: '100%',
          maxWidth: imgMax,
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
        h3: {
          marginTop: 8,
          marginBottom: 10,
          color: '#ED5192',
          fontFamily: GraphitFonts.GraphitBold,
          fontSize: 24,
          lineHeight: 24,
        },
      }}
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
  );
}
