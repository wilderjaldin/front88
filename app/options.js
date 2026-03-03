import countries from '@/data-runtime/countries.json';
import cities from '@/data-runtime/cities.json';
import currencies from '@/data-runtime/currencies.json';
import doc_types from '@/data-runtime/doc_types.json';
import reports from '@/data-runtime/reports.json';
import brands from '@/data-runtime/brands.json';
import suppliers from '@/data-runtime/suppliers.json';
import types_spares_es from '@/data-runtime/types_spares_es.json';
import types_spares_en from '@/data-runtime/types_spares_en.json';
import status_spare from '@/data-runtime/status_spare.json';
import status_code from '@/data-runtime/status_code.json';
import units_spare from '@/data-runtime/units_spare.json';
import { useEffect, useState } from "react";

const options = { countries, cities, currencies, doc_types, reports, brands, suppliers, types_spares_es, types_spares_en, status_spare, status_code, units_spare };

export function useOptionsSelect(option) {

  const [data, setData] = useState([]);

  useEffect(() => {
    fetch(`/api/options/${option}`, { cache: "no-store" })
      .then(res => res.json())
      .then(setData)
      .catch(() => setData([]));
  }, [option]);
  return data;
}


export function getNameOption(option, value = '') {
  let file = options[option] || {};
  if (file) {
    let data = file.filter((f) => { return f.value?.toUpperCase() == value.toUpperCase() });
    if (data.length) {
      return data[0].label;
    }
  }

  return '';
}

export function getNameCity(country_code = '', id) {
  let file = options['cities'][country_code.toUpperCase()] || {};
  if (file) {
    let data = file.filter((f) => { return f.value == id });
    if (data.length) {
      return data[0].label;
    }
  }

  return '';
}