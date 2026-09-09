/**
 * Faylka caawiyaha (Helper Functions)
 * Waxaa loogu talagalay hawlallo yaryar oo dib loo isticmaali karo
 */

// =============================================
// 1. QAABAYNTA XAALADA (STATE BADGE COLORS)
// =============================================
// Tani waxay soo celinaysaa class-ka saxda ah ee Bootstrap-ka
export const getStateBadgeClass = (state) => {
  if (!state) return 'bg-secondary';

  const lowerState = state.toLowerCase();

  switch (lowerState) {
    case 'pending':
      return 'bg-warning text-dark'; // Jaalle
    case 'processing':
      return 'bg-primary'; // Buluug
    case 'confirmed':
      return 'bg-success'; // Cagaar
    case 'cancelled':
      return 'bg-danger'; // Casaan
    default:
      return 'bg-secondary'; // Cawlan
  }
};

// =============================================
// 2. QAABAYNTA TAARIIKHDA (FORMAT DATE)
// =============================================
// Waxay u beddeshaa 'YYYY-MM-DD' una beddesha 'MMM DD, YYYY' (tusaale: Sep 02, 2026)
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// =============================================
// 3. QAABAYNTA LACAGTA (FORMAT CURRENCY)
// =============================================
// Waxay ku dartaa $ iyo laba jibbaar (tusaale: $1,250.50)
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0.00';
  return `$${parseFloat(amount).toFixed(2)}`;
};

// =============================================
// 4. SOO SAAR XARIIQDA UGU DAMBEEYSA (TRUNCATE TEXT)
// =============================================
// Haddii qoraalku dheer yahay, waxaa lagu soo koobayaa
export const truncateText = (text, maxLength = 20) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// =============================================
// 5. XISAABI WADARTA DALABKA (CALCULATE ORDER TOTALS)
// =============================================
// Waxay soo celinaysaa: subtotal, discount amount, iyo grand total
export const calculateOrderTotals = (items, discountPercent) => {
  // 1. Xisaabi subtotal (wadarta line_total ee dhammaan items-yada)
  const subtotal = items.reduce((acc, item) => {
    const qty = parseFloat(item.O_quantity) || 0;
    const price = parseFloat(item.O_price) || 0;
    const disc = parseFloat(item.O_discount) || 0;
    const lineTotal = (qty * price) - disc;
    return acc + lineTotal;
  }, 0);

  // 2. Xisaabi qiimaha dhimista (discount amount)
  const discountPercentage = parseFloat(discountPercent) || 0;
  const discountAmount = (subtotal * discountPercentage) / 100;

  // 3. Xisaabi wadarta guud (grand total)
  const grandTotal = subtotal - discountAmount;

  return {
    subtotal,
    discountAmount,
    grandTotal,
  };
};