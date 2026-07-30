// common.js

function initMessageObserver() {
    const msgElement = document.getElementById("msg");
    if (!msgElement) return;
    
    let msgTimeout;
    const observer = new MutationObserver(() => {
        if (msgElement.innerHTML !== "") {
            clearTimeout(msgTimeout);
            msgTimeout = setTimeout(() => {
                msgElement.innerHTML = "";
                msgElement.className = "";
            }, 3000);
        }
    });
    
    observer.observe(msgElement, { childList: true, subtree: true, characterData: true });
}

function validate_uniqueness(fieldId, colIndex, msgId, errorMsg) {
    var val = document.getElementById(fieldId).value.trim();
    if (val === "") return;
    
    if (typeof users_data !== 'undefined') {
        for (var i = 0; i < users_data.length; i++) {
            if (find_clicked && users_data[i][0] == record_id) continue;
            
            if (users_data[i][colIndex] == val) {
                document.getElementById(msgId).innerHTML = errorMsg;
                return false;
            }
        }
    }
    return true;
}

function toggleDropdown(fieldId) {
    var container = document.getElementById("tableContainer_" + fieldId);
    if (!container) return;
    if (container.style.display === "block") {
        container.style.display = "none";
    } else {
        var allContainers = document.querySelectorAll(".dropdown-table-container");
        allContainers.forEach(c => c.style.display = "none");
        container.style.display = "block";
    }
}

function selectOption(fieldId, value, displayText) {
    var hidden = document.getElementById(fieldId);
    var display = document.getElementById(fieldId + "_display");
    if (hidden) hidden.value = value;
    if (display) display.value = displayText || value;
    var container = document.getElementById("tableContainer_" + fieldId);
    if (container) container.style.display = "none";
}

window.addEventListener('click', function(e) {
    if (!e.target.closest('.custom-dropdown')) {
        var dropdowns = document.querySelectorAll('.dropdown-table-container');
        dropdowns.forEach(d => d.style.display = 'none');
    }
});

function togglePassword() {
    var pwd = document.getElementById("passwordHash");
    if (pwd) {
        pwd.type = pwd.type === "password" ? "text" : "password";
    }
}

function resetPasswordIcon() {
    var pwd = document.getElementById("passwordHash");
    if (pwd) {
        pwd.type = "password";
    }
}

function checkDirtyState() {
    if (typeof position === 'undefined' || position === -1) return false;
    
    var currentData = {
        userType: document.getElementById("userType").value,
        fullName: document.getElementById("fullName").value,
        mobileNo: document.getElementById("mobileNo").value,
        email: document.getElementById("email").value,
        passwordHash: document.getElementById("passwordHash").value,
        isActive: document.getElementById("isActive").value
    };
    
    var originalData = {
        userType: (users_data[position][1] || "").trim(),
        fullName: (users_data[position][2] || "").trim(),
        mobileNo: (users_data[position][3] || "").trim(),
        email: (users_data[position][4] || "").trim(),
        passwordHash: (decodePassword(users_data[position][5]) || "").trim(),
        isActive: (mapActiveValue(users_data[position][6]) || "").trim()
    };
    
    return JSON.stringify(currentData) !== JSON.stringify(originalData);
}

let pendingNavigationCallback = null;

function navigateWithCheck(callback) {
    if (typeof find_clicked !== 'undefined' && find_clicked && checkDirtyState()) {
        pendingNavigationCallback = callback;
        showConfirm("Would you like to save the changes?", 
            function() { 
                if (typeof save_data === 'function') {
                    save_data(); 
                }
                if (pendingNavigationCallback) pendingNavigationCallback();
            },
            function() { 
                if (pendingNavigationCallback) pendingNavigationCallback();
            }
        );
    } else {
        callback();
    }
}

function showConfirm(msg, yesCallback, noCallback) {
    var msgEl = document.getElementById("confirmMessage");
    if (!msgEl) return;
    
    msgEl.innerHTML = msg;
    
    var buttonsHtml = `
        <button type="button" class="save-btn" onclick="handleConfirm('yes')" style="width: 100px;">Yes</button>
        <button type="button" class="prev-btn" onclick="handleConfirm('no')" style="width: 100px;">No</button>
        <button type="button" class="prev-btn" onclick="handleConfirm('cancel')" style="width: 100px;">Cancel</button>
    `;
    document.getElementById("confirmButtons").innerHTML = buttonsHtml;
    document.getElementById("confirmOverlay").style.display = "flex";
    
    window._confirmYes = yesCallback;
    window._confirmNo = noCallback;
}

function handleConfirm(choice) {
    var overlay = document.getElementById("confirmOverlay");
    if (overlay) overlay.style.display = "none";
    if (choice === 'yes' && window._confirmYes) {
        window._confirmYes();
    } else if (choice === 'no' && window._confirmNo) {
        window._confirmNo();
    }
    window._confirmYes = null;
    window._confirmNo = null;
}
