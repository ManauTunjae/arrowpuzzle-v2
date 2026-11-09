import { loadCampaign, withCampaign } from '../theme.js';
import { createDonation, updateDonation, getDonationQr } from '../api.js';
import { getToken } from '../player.js';

const RESULT_KEY = 'arrowpuzzle.lastResult';
const DEFAULT_AMOUNTS = [20, 50, 100, 200];

function readResult() {
  try {
    return JSON.parse(sessionStorage.getItem(RESULT_KEY));
  } catch {
    return null;
  }
}

// A gift is linked to a saved game. Without one, go back to the game.
const result = readResult();
if (!getToken() || !result?.saved || !result.sessionId) {
  location.replace(withCampaign('play.html'));
}

const steps = {
  choose: document.querySelector('#step-choose'),
  pay: document.querySelector('#step-pay'),
  done: document.querySelector('#step-done'),
};
const intro = document.querySelector('#intro');
const form = document.querySelector('#amount-form');
const options = document.querySelector('#amount-options');
const errorEl = document.querySelector('#error');
const continueBtn = document.querySelector('#continue');
const paySummary = document.querySelector('#pay-summary');
const qrBox = document.querySelector('#qr-box');
const qrImg = document.querySelector('#qr');
const openSwish = document.querySelector('#open-swish');
const payError = document.querySelector('#pay-error');
const simulateBtn = document.querySelector('#simulate');
const doneText = document.querySelector('#done-text');
document.querySelector('#back').href = withCampaign('result.html');

// Phone: "Open Swish" button. Computer: QR code.
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  || window.matchMedia('(pointer: coarse)').matches;

let campaign = null;
let donation = null;

function show(name) {
  for (const [key, section] of Object.entries(steps)) section.hidden = key !== name;
  const heading = steps[name].querySelector('h1');
  heading.focus(); // so screen readers announce the new step
}

function renderAmounts(amounts) {
  amounts.forEach((amount, index) => {
    const label = document.createElement('label');
    label.className = 'amount';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'amount';
    input.value = amount;
    input.checked = index === 1 || amounts.length === 1; // second one is the default
    const text = document.createElement('span');
    text.textContent = `${amount} kr`;
    label.append(input, text);
    options.append(label);
  });
}

try {
  campaign = await loadCampaign();
  intro.textContent = `Din gåva går till ${campaign.orgName}. Tack för att du tände ljus!`;
  renderAmounts(campaign.content.amounts || DEFAULT_AMOUNTS);
} catch (error) {
  errorEl.textContent = error.message;
  continueBtn.disabled = true;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorEl.textContent = '';

  const chosen = form.querySelector('input[name="amount"]:checked');
  if (!chosen) {
    errorEl.textContent = 'Välj ett belopp.';
    return;
  }

  continueBtn.disabled = true; // avoid double submit
  try {
    donation = await createDonation(result.sessionId, Number(chosen.value), isMobile ? 'swish_link' : 'qr');

    paySummary.textContent = `${donation.amount} kr till ${campaign.orgName}. Swish-nummer: ${donation.swishNumber} (påhittat).`;
    if (isMobile) {
      openSwish.href = donation.swishLink;
      openSwish.hidden = false;
    } else {
      qrImg.src = await getDonationQr(donation.id);
      qrBox.hidden = false;
    }
    show('pay');
  } catch (error) {
    errorEl.textContent = error.message;
  } finally {
    continueBtn.disabled = false;
  }
});

// Tell the server that the button was pressed. The link still opens Swish.
openSwish.addEventListener('click', () => {
  updateDonation(donation.id, 'clicked').catch(() => {});
});

simulateBtn.addEventListener('click', async () => {
  payError.textContent = '';
  simulateBtn.disabled = true;
  try {
    await updateDonation(donation.id, 'simulated_paid');
    doneText.textContent = `Tack för din gåva på ${donation.amount} kr till ${campaign.orgName}! (Simulerad. Ingen riktig betalning gjordes.)`;
    if (qrImg.src.startsWith('blob:')) URL.revokeObjectURL(qrImg.src);
    show('done');
  } catch (error) {
    payError.textContent = error.message;
    simulateBtn.disabled = false;
  }
});
