import localFont from 'next/font/local';

/** @notice learn more about localFont at https://nextjs.org/docs/app/building-your-application/optimizing/fonts#local-fonts */
const StyreneAWebFont = localFont({
  src: [
    {
      path: './styreneA-webfont/StyreneA-Black-Web.woff2',
      weight: '900',
      style: 'normal',
    },
    {
      path: './styreneA-webfont/StyreneA-BlackItalic-Web.woff2',
      weight: '900',
      style: 'italic',
    },
    {
      path: './styreneA-webfont/StyreneA-Bold-Web.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: './styreneA-webfont/StyreneA-BoldItalic-Web.woff2',
      weight: '800',
      style: 'italic',
    },
    {
      path: './styreneA-webfont/StyreneA-Bold-Web.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: './styreneA-webfont/StyreneA-BoldItalic-Web.woff2',
      weight: '700',
      style: 'italic',
    },
    {
      path: './styreneA-webfont/StyreneA-Bold-Web.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: './styreneA-webfont/StyreneA-BoldItalic-Web.woff2',
      weight: '600',
      style: 'italic',
    },
    {
      path: './styreneA-webfont/StyreneA-Medium-Web.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: './styreneA-webfont/StyreneA-MediumItalic-Web.woff2',
      weight: '500',
      style: 'italic',
    },
    {
      path: './styreneA-webfont/StyreneA-Regular-Web.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './styreneA-webfont/StyreneA-RegularItalic-Web.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: './styreneA-webfont/StyreneA-Light-Web.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: './styreneA-webfont/StyreneA-LightItalic-Web.woff2',
      weight: '300',
      style: 'italic',
    },
    {
      path: './styreneA-webfont/StyreneA-Light-Web.woff2',
      weight: '200',
      style: 'normal',
    },
    {
      path: './styreneA-webfont/StyreneA-LightItalic-Web.woff2',
      weight: '200',
      style: 'italic',
    },
    {
      path: './styreneA-webfont/StyreneA-Thin-Web.woff2',
      weight: '100',
      style: 'normal',
    },
    {
      path: './styreneA-webfont/StyreneA-ThinItalic-Web.woff2',
      weight: '100',
      style: 'italic',
    },
  ],
  display: 'swap',
  variable: '--font-styrene',
});

export default StyreneAWebFont;
