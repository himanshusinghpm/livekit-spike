document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['targetChannel', 'syncCode'], (result) => {
        if (result.targetChannel) document.getElementById('channelInput').value = result.targetChannel;
        if (result.syncCode) document.getElementById('syncCodeInput').value = result.syncCode;
    });
});

document.getElementById('saveBtn').addEventListener('click', () => {
    let channel = document.getElementById('channelInput').value.trim().toLowerCase();
    let code = document.getElementById('syncCodeInput').value.trim();
    
    if (channel.includes("kick.com/")) {
        channel = channel.split("kick.com/")[1].split("/")[0];
    }
    
    chrome.storage.local.set({ targetChannel: channel, syncCode: code }, () => {
        const status = document.getElementById('status');
        status.textContent = '🔒 Extension Authenticated & Locked!';
        setTimeout(() => status.textContent = '', 3000);
    });
});