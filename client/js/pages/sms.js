import { loadCampaign, withCampaign } from '../theme.js';
import { createLead } from '../api.js';
import { getToken } from '../player.js';

// No player yet? Go to the start page first.
if (!getToken()) location.replace(withCampaign('index.html'));

const form = document.querySelector('#sms-form');
const phoneInput = document.querySelector('#phone');
const consentInput = document.querySelector('#consent');
const consentLabel = document.querySelector('#consent-label');
const errorEl = document.querySelector('#error');
const submit = document.querySelector('#submit');
document.querySelector('#skip').href = withCampaign('thanks.html');

// The box is NOT ticked from the start (GDPR). The person must do it.
consentInput.checked = false;
consentLabel.textContent = 'Jag vill få SMS om kampanjen och godkänner att mitt nummer sparas för det. Jag kan be om att få det borttaget.';

try {
  const campaign = await loadCampaign();
  consentLabel.textContent = `Jag vill få SMS om kampanjen och godkänner att ${campaign.orgName} sparar mitt nummer för det. Jag kan be om att få det borttaget.`;
} catch {
  // Page works with the default text.
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorEl.textContent = '';

  if (!phoneInput.value.trim()) {
    errorEl.textContent = 'Skriv ditt mobilnummer, eller hoppa över.';
    phoneInput.focus();
    return;
  }
  if (!consentInput.checked) {
    errorEl.textContent = 'Du måste kryssa i rutan för att vi ska få spara numret.';
    consentInput.focus();
    return;
  }

  submit.disabled = true; // avoid double submit
  try {
    await createLead(phoneInput.value, true);
    location.href = withCampaign('thanks.html');
  } catch (error) {
    if (error.status === 401) {
      location.replace(withCampaign('index.html')); // token is not valid any more
      return;
    }
    errorEl.textContent = error.message;
    submit.disabled = false;
  }
});
