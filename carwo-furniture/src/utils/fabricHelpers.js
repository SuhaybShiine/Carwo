// Kala saar marada: Shabag vs Gogol (kale)
export function isShabagFabric(f) {
  if (!f) return false;
  const code = String(f.Fabric_Code || '').toLowerCase();
  const name = String(f.Fabric_Name || '').toLowerCase();
  return (
    code.startsWith('shb') ||
    code.includes('shabag') ||
    code.includes('shabaq') ||
    name.includes('shabag') ||
    name.includes('shabaq') ||
    name.includes('shuul')
  );
}

export function isGogolFabric(f) {
  if (!f) return false;
  const code = String(f.Fabric_Code || '').toLowerCase();
  const name = String(f.Fabric_Name || '').toLowerCase();
  return (
    code.startsWith('gog') ||
    code.includes('gogol') ||
    code.includes('gogosha') ||
    name.includes('gogol') ||
    name.includes('gogosha')
  );
}

// Gogol dropdown: marada aan shabag ahayn (gogol + saafi)
export function getGogolFabrics(fabrics = []) {
  const list = fabrics.filter((f) => !isShabagFabric(f));
  return list.length > 0 ? list : fabrics;
}

// Shabag dropdown: kaliya marada shabagga
export function getShabagFabrics(fabrics = []) {
  const list = fabrics.filter(isShabagFabric);
  return list.length > 0 ? list : fabrics;
}

// Item_Type-ka Gogol ma yahay?
export function isGogolType(t) {
  const s = String(t || '').toLowerCase();
  return s.includes('gogol') || s.includes('gogosha');
}