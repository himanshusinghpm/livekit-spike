function updateUI() {
    chrome.runtime.sendMessage({ action: "GET_STATS" }, (response) => {
        if (!response) return;
        
        const statusBadge = document.getElementById('statusBadge');
        if (response.status === "TRACKING") {
            statusBadge.textContent = "LIVE TRACKING";
            statusBadge.className = "status-badge status-tracking";
        } else {
            statusBadge.textContent = "IDLE (Open a Kick stream)";
            statusBadge.className = "status-badge status-idle";
        }

        document.getElementById('channelName').textContent = response.channel;
        document.getElementById('currentPeak').textContent = response.peak > 0 ? response.peak : "--";
        document.getElementById('currentAvg').textContent = response.avg > 0 ? response.avg : "--";
    });
}

// Fetch stats immediately when popup opens
updateUI();

// Refresh the UI every 2 seconds while the popup is open
setInterval(updateUI, 2000);
