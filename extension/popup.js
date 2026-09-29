document.addEventListener('DOMContentLoaded', () => {
  const syncCodeInput = document.getElementById('syncCode');
  const targetYtInput = document.getElementById('targetYt');
  const targetKickInput = document.getElementById('targetKick');
  const saveBtn = document.getElementById('saveBtn');
  const statusMsg = document.getElementById('statusMsg');

  // Load existing configuration on open
  chrome.storage.local.get(['syncCode', 'targetYt', 'targetKick'], (result) => {
    if (result.syncCode) syncCodeInput.value = result.syncCode;
    if (result.targetYt) targetYtInput.value = result.targetYt;
    if (result.targetKick) targetKickInput.value = result.targetKick;
  });

  // Save configuration and trigger identity lock
  saveBtn.addEventListener('click', () => {
    const config = {
      syncCode: syncCodeInput.value.trim(),
      targetYt: targetYtInput.value.trim(),
      targetKick: targetKickInput.value.trim()
    };

    chrome.storage.local.set(config, () => {
      // Show success feedback
      statusMsg.classList.add('visible');
      saveBtn.textContent = "Saved Successfully";

      setTimeout(() => {
        statusMsg.classList.remove('visible');
        saveBtn.textContent = "Lock Configuration";
      }, 2500);
    });
  });
});
