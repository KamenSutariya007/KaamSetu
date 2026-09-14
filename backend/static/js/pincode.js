/**
 * KaamSetu — Pincode Lookup Helper (Ahmedabad / Gujarat / All-India)
 */

function setupPincodeLookup(pincodeInputId, cityInputId, stateInputId, areaInputId) {
  const pinInput = document.getElementById(pincodeInputId);
  const cityInput = document.getElementById(cityInputId);
  const stateInput = document.getElementById(stateInputId);
  const areaInput = areaInputId ? document.getElementById(areaInputId) : null;

  if (!pinInput) return;

  let debounceTimer = null;

  pinInput.addEventListener('input', () => {
    const pin = pinInput.value.replace(/\D/g, '').slice(0, 6);
    pinInput.value = pin;

    clearTimeout(debounceTimer);
    if (pin.length === 6) {
      debounceTimer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/auth/pincode/${pin}/`);
          if (res.ok) {
            const data = await res.json();
            if (cityInput && data.city) cityInput.value = data.city;
            if (stateInput && data.state) stateInput.value = data.state;
            if (areaInput && data.area) {
              areaInput.value = data.area;
            }
          }
        } catch (e) {
          console.warn('Pincode lookup error:', e);
        }
      }, 400);
    }
  });
}
