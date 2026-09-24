// ============================================================
// OFFLINE MODE — Email lama diri karo (internet ma jiro)
// Code-ka wuxuu ku soo bandhigayaa TERMINAL-KA
// Frontend-ka ayaa sidoo kale soo bandhigayaa code-ka
// ============================================================

async function sendEmail({ to, subject, html, text, code }) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 EMAIL (OFFLINE MODE — lama diray)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('To      :', to);
  console.log('Subject :', subject);
  if (code) {
    console.log('CODE    :', code, '  ← ← ← KAN AYAA LA GELIYAA');
  }
  if (text) {
    console.log('Text    :', text);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Ma jiro email la diray — kaliya waa la soo bandhigay terminal-ka
  return {
    messageId: 'offline-' + Date.now(),
    accepted: [to],
    offline: true,
  };
}

module.exports = sendEmail;