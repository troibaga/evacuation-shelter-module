'use client';

import * as React from 'react';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { useServerInsertedHTML } from 'next/navigation';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

function createEmotionCache() {
  return createCache({
    key: 'css',
    prepend: true,
  });
}

export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ cache }] = React.useState(() => {
    const cache = createEmotionCache();
    cache.compat = true;

    return { cache };
  });

  useServerInsertedHTML(() => {
    return null;
  });

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </CacheProvider>
  );
}