document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['kickChannel', 'ytChannel', 'syncCode'], (result) => {
        if (result.kickChannel) document.getElementById('kickInput').value = result.kickChannel;
        if (result.ytChannel) document.getElementById('ytInput').value = result.ytChannel;
        if (result.syncCode) document.getElementById('syncCodeInput').value = result.syncCode;
    });
});

document.getElementById('saveBtn').addEventListener('click', () => {
    let kick = document.getElementById('kickInput').value.trim().toLowerCase();
    let yt = document.getElementById('ytInput').value.trim().toLowerCase();
    let code = document.getElementById('syncCodeInput').value.trim();
    
    if (kick.includes("kick.com/")) kick = kick.split("kick.com/")[1].split("/")[0];
    if (yt && !yt.startsWith("@")) yt = "@" + yt;
    
    chrome.storage.local.set({ kickChannel: kick, ytChannel: yt, syncCode: code }, () => {
        const status = document.getElementById('status');
        status.textContent = '🔒 Worker Locked & Loaded!';
        setTimeout(() => status.textContent = '', 3000);
    });
});