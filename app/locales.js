'use client';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

import { useSelector } from 'react-redux';
import { getLocale } from '@/store/localeSlice';
import { useEffect, useState } from 'react';

const translations = { en, es };


export function useTranslation() {
  const locale = useSelector(getLocale);
  const [customData, setCustomData] = useState({});

  useEffect(() => {
    fetch('/api/locales', { cache: 'no-store' })
      .then(res => res.json())
      .then(setCustomData)
      .catch(() => setCustomData({dd: 'd'}));
  }, [locale]); // 👈 opcional si quieres refrescar por idioma

  const base = translations[locale] || translations.en;

  return {
    ...base,
    ...customData, // custom sobreescribe traducciones
  };
}