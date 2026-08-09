let modalOverlay = null;

function showModal({ title, message, buttons = [{ text: "OK", class: "primary", value: "ok" }] }) {
    return new Promise((resolve) => {
        if (!modalOverlay) {
            modalOverlay = document.createElement("div");
            modalOverlay.className = "modal-overlay";
            document.body.appendChild(modalOverlay);
        }

        const actionsHtml = buttons.map((btn, idx) => {
            let btnClass = "modal-btn-secondary";
            if (btn.class === "primary" || btn.class === "success") btnClass = "modal-btn-primary";
            if (btn.class === "neutral") btnClass = "modal-btn-neutral";
            return `<button class="modal-btn ${btnClass}" data-index="${idx}">${btn.text}</button>`;
        }).join("");

        modalOverlay.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-title">${title}</div>
                <div class="modal-message">${message}</div>
                <div class="modal-actions">
                    ${actionsHtml}
                </div>
            </div>
        `;

        setTimeout(() => {
            modalOverlay.classList.add("show");
        }, 10);

        const actionButtons = modalOverlay.querySelectorAll(".modal-btn");
        actionButtons.forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.getAttribute("data-index"));
                const value = buttons[idx].value;
                modalOverlay.classList.remove("show");
                setTimeout(() => {
                    resolve(value);
                }, 200);
            };
        });
    });
}
const messageBox = document.getElementById("messageBox");

function showMessage(message, type) {
    if (!messageBox) return;
    messageBox.innerText = message;
    messageBox.className = "message-box " + type + " show";

    clearTimeout(messageBox.timer);
    messageBox.timer = setTimeout(() => {
        messageBox.className = "message-box";
    }, 5000);
}

function hideMessage() {
    if (!messageBox) return;
    clearTimeout(messageBox.timer);
    messageBox.className = "message-box";
    messageBox.innerText = "";
}

function hasUnsavedChanges() {
    const isNewRecordMode = (saveBtn && saveBtn.style.display !== "none");
    if (isNewRecordMode) {
        return (areaNameInput.value.trim() !== "" || 
                cityIdInput.value.trim() !== "");
    }
    return false;
}

function hasPendingUpdates() {
    const isUpdateMode = (updateBtn && updateBtn.style.display !== "none");
    if (isUpdateMode && originalRecord) {
        return (areaNameInput.value.trim() !== originalRecord.area_name ||
                cityIdInput.value.trim() !== originalRecord.city_id);
    }
    return false;
}

async function confirmLeave(onConfirmAction) {
    if (hasUnsavedChanges() || hasPendingUpdates()) {
        const choice = await showModal({
            title: "Save changes?",
            message: "Would you like to save the changes?",
            buttons: [
                { text: "Yes", class: "primary", value: "yes" },
                { text: "No", class: "secondary", value: "no" },
                { text: "Cancel", class: "neutral", value: "cancel" }
            ]
        });

        if (choice === "yes") {
            let success = false;
            if (hasUnsavedChanges()) {
                success = await saveRecord(false);
            } else if (hasPendingUpdates()) {
                success = await updateRecord(false);
            }
            if (success) {
                onConfirmAction();
            }
        } else if (choice === "no") {
            onConfirmAction();
        }
    } else {
        onConfirmAction();
    }
}

const areaIdInput = document.getElementById("area_id");
const areaNameInput = document.getElementById("area_name");
const cityIdInput = document.getElementById("city_id");
const citySuggestions = document.getElementById("citySuggestions");

const saveBtn = document.getElementById("saveBtn");
const updateBtn = document.getElementById("updateBtn");
const deleteBtn = document.getElementById("deleteBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const exitBtn = document.getElementById("exitBtn");
const findBtn = document.getElementById("findBtn");

const cityNameDisplay = document.getElementById("city_name_display");
const stateInput = document.getElementById("state");
const countryInput = document.getElementById("country");
const cityDropdown = document.getElementById("cityDropdown");
const cityDropdownBody = document.getElementById("cityDropdownBody");
const citySearchInput = document.getElementById("citySearchInput");
const cityWrapper = document.getElementById("cityWrapper");

const originalValueDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

Object.defineProperty(cityIdInput, 'value', {
    get: function() {
        return originalValueDescriptor.get.call(this);
    },
    set: function(val) {
        const trimmedVal = String(val).trim();
        originalValueDescriptor.set.call(this, trimmedVal);

        if (trimmedVal === "") {
            if (cityNameDisplay) cityNameDisplay.value = "";
            if (stateInput) stateInput.value = "";
            if (countryInput) countryInput.value = "";
            return;
        }

        if (citiesList && citiesList.length > 0) {
            const city = citiesList.find(c => String(c[0]) === trimmedVal);
            if (city) {
                if (cityNameDisplay) cityNameDisplay.value = city[3] || "";
                if (stateInput) stateInput.value = city[2] || "";
                if (countryInput) countryInput.value = city[1] || "";
            } else {
                fetchCityDetails(trimmedVal);
            }
        } else {
            fetchCityDetails(trimmedVal);
        }
    }
});

async function fetchCityDetails(cityId) {
    if (!cityId) return;
    try {
        const response = await fetch(`http://localhost:3000/city-master/${cityId}`);
        const result = await response.json();
        if (result.success && result.data) {
            const data = result.data;
            if (cityNameDisplay) cityNameDisplay.value = data[3] || "";
            if (stateInput) stateInput.value = data[2] || "";
            if (countryInput) countryInput.value = data[1] || "";
        }
    } catch (err) {
        console.error("Error fetching city details:", err);
    }
}

let areas = [];
let citiesList = [];
let currentIndex = -1;
let fetchPromise = null;
let lastSearchedId = "";
let lastSearchedCityId = "";
let isCityIdValid = false;
let confirmAction = null; 
let originalRecord = null;
let isFetchingNextId = false;
let isAutoFilling = false;

async function fetchCities() {
    try {
        const response = await fetch("http://localhost:3000/city-master");
        citiesList = await response.json();
        
        const currentVal = cityIdInput.value;
        if (currentVal && !currentVal.includes(" - ")) {
            cityIdInput.value = currentVal;
        }
    } catch (err) {
        console.error("Error loading cities list:", err);
    }
}

async function fetchAreas() {
    try {
        const response = await fetch("http://localhost:3000/area-master");
        const data = await response.json();
       
        areas = data;
        areas.sort((a, b) => Number(a[0]) - Number(b[0]));
    } catch (err) {
        console.error("Error loading areas list:", err);
    }
}

function displayArea(areaRow) {
    if (!areaRow) return;
    const isNewMode = (saveBtn && saveBtn.style.display !== "none");
    if (isNewMode) {
        areaIdInput.readOnly = true;
        areaIdInput.setAttribute("readonly", "readonly");
    } else {
        areaIdInput.readOnly = false;
        areaIdInput.removeAttribute("readonly");
    }
    areaIdInput.value = areaRow[0]; 
    areaNameInput.value = areaRow[1] || ""; 
    cityIdInput.value = areaRow[2] || ""; 
    
    originalRecord = {
        area_id: String(areaRow[0]),
        area_name: areaRow[1] || "",
        city_id: String(areaRow[2] || "")
    };

    lastSearchedId = String(areaRow[0]);
    lastSearchedCityId = String(areaRow[2] || "");
    isCityIdValid = true;
    if (findBtn) findBtn.innerText = "New";
}

function resetButtonState() {
    if (saveBtn) saveBtn.style.display = "inline-block";
    if (updateBtn) updateBtn.style.display = "none";
    if (deleteBtn) deleteBtn.style.display = "none";
    if (prevBtn) prevBtn.style.display = "inline-block";
    if (nextBtn) nextBtn.style.display = "none";

    if (areaIdInput) {
        areaIdInput.readOnly = true;
        areaIdInput.setAttribute("readonly", "readonly");
    }
}

function setFindButtonState() {
    if (saveBtn) saveBtn.style.display = "none";
    if (updateBtn) updateBtn.style.display = "inline-block";
    if (deleteBtn) deleteBtn.style.display = "none";
    if (prevBtn) prevBtn.style.display = "inline-block";
    if (nextBtn) nextBtn.style.display = "inline-block";

    if (areaIdInput) {
        areaIdInput.readOnly = false;
        areaIdInput.removeAttribute("readonly");
    }
}

function clearForm(shouldFocus = true) {
    areaIdInput.readOnly = true;
    areaIdInput.setAttribute("readonly", "readonly");
    areaIdInput.value = "";
    areaNameInput.value = "";
    cityIdInput.value = "";
    originalRecord = null;
    currentIndex = -1;
    lastSearchedId = "";
    lastSearchedCityId = "";
    isCityIdValid = false;
    resetButtonState();
    if (shouldFocus) {
        areaIdInput.focus();
    }
    if (findBtn) findBtn.innerText = "Find";
    fetchNextAreaId();
}

function findAreaIndex(id) {
    return areas.findIndex(a => a[0] == id);
}

window.addEventListener("DOMContentLoaded", async () => {
    fetchPromise = fetchAreas();
    const citiesPromise = fetchCities();
    await Promise.all([fetchPromise, citiesPromise]);
    clearForm(false);
});

async function searchAreaById(id) {
    const trimmedId = String(id).trim();
    if (trimmedId === "") return;
    if (trimmedId === lastSearchedId) return;
    lastSearchedId = trimmedId;

    
    const index = findAreaIndex(trimmedId);
    if (index !== -1) {
        displayArea(areas[index]);
        currentIndex = index;
        setFindButtonState();
        return;
    }

    areaNameInput.value = "";
    cityIdInput.value = "";
    setFindButtonState();
    isCityIdValid = false;
    if (findBtn) findBtn.innerText = "New";
    areaIdInput.readOnly = false;
    areaIdInput.removeAttribute("readonly");
    showMessage("No Record Found", "error");
}



findBtn.addEventListener("click", () => {
    confirmLeave(async () => {
        hideMessage();
        if (findBtn.innerText === "New") {
            clearForm();
            return;
        }

        const isNewMode = (saveBtn && saveBtn.style.display !== "none");
        if (isNewMode) {
            
            areaIdInput.readOnly = false;
            areaIdInput.removeAttribute("readonly");
            areaIdInput.value = "";
            areaNameInput.value = "";
            cityIdInput.value = "";
            originalRecord = null;
            currentIndex = -1;
            lastSearchedId = "";
            lastSearchedCityId = "";
            isCityIdValid = false;
            
            if (findBtn) findBtn.innerText = "New";
            setFindButtonState();
            areaIdInput.focus();
            return;
        }

        const id = areaIdInput.value.trim();

        if (id === "") {
            await fetchAreas();
            if (areas.length === 0) {
                showMessage("No record found.", "error");
                return;
            }
            currentIndex = -1;
            if (findBtn) findBtn.innerText = "New";
            setFindButtonState();
            return;
        }

        await searchAreaById(id);
    });
});


async function fetchNextAreaId() {
    const isNewMode = (saveBtn && saveBtn.style.display !== "none");
    if (!isNewMode || areaIdInput.value.trim() !== "" || isFetchingNextId) return;

    isFetchingNextId = true;
    try {
        const response = await fetch("http://localhost:3000/area-master/next-id");
        const result = await response.json();
        if (result.success && areaIdInput.value.trim() === "") {
            isAutoFilling = true;
            areaIdInput.value = result.nextId;
            areaIdInput.dispatchEvent(new Event("input"));
        }
    } catch (err) {
        console.error("Error fetching next area ID:", err);
    } finally {
        isFetchingNextId = false;
    }
}

areaIdInput.addEventListener("click", fetchNextAreaId);
areaIdInput.addEventListener("focus", fetchNextAreaId);

let lookupTimeout = null;
let cityLookupTimeout = null;


areaIdInput.addEventListener("input", () => {
    hideMessage();
    if (lookupTimeout) {
        clearTimeout(lookupTimeout);
    }

    if (isAutoFilling) {
        isAutoFilling = false;
        return;
    }

    
    
    const hasFields = (areaNameInput.value.trim() !== "" || 
                       cityIdInput.value.trim() !== "");
    const isModified = hasPendingUpdates();
    if ((hasFields && !originalRecord) || isModified) {
        return;
    }

    const id = areaIdInput.value.trim();
    if (id === "") {
        areaNameInput.value = "";
        cityIdInput.value = "";
        originalRecord = null;
        isCityIdValid = false;

        const isNewMode = (saveBtn && saveBtn.style.display !== "none");
        if (isNewMode) {
            resetButtonState();
            if (findBtn) findBtn.innerText = "Find";
        } else {
            setFindButtonState();
            if (findBtn) findBtn.innerText = "New";
        }
        return;
    }

    
    areaNameInput.value = "";
    cityIdInput.value = "";
    originalRecord = null;

    const index = findAreaIndex(id);
    if (index !== -1) {
        displayArea(areas[index]);
        currentIndex = index;
        setFindButtonState();
        
        return;
    }

    lookupTimeout = setTimeout(async () => {
        await searchAreaById(id);
    }, 2000);
});


areaIdInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        const id = areaIdInput.value.trim();
        if (id !== "") {
            confirmLeave(async () => {
                if (lookupTimeout) {
                    clearTimeout(lookupTimeout);
                }
                await searchAreaById(id);
            });
        }
    }
});


function renderCityDropdown(filteredCities) {
    if (!cityDropdownBody) return;
    cityDropdownBody.innerHTML = filteredCities.map(city => {
        
        return `
            <tr data-id="${city[0]}" data-country="${city[1]}" data-state="${city[2]}" data-city="${city[3]}">
                <td>${city[0]}</td>
                <td>${city[1]}</td>
                <td>${city[2]}</td>
                <td>${city[3]}</td>
            </tr>
        `;
    }).join("");

    
    const rows = cityDropdownBody.querySelectorAll("tr");
    rows.forEach(row => {
        row.onclick = (e) => {
            e.stopPropagation();
            const id = row.getAttribute("data-id");
            const country = row.getAttribute("data-country");
            const state = row.getAttribute("data-state");
            const city = row.getAttribute("data-city");

            
            cityIdInput.value = id;
            isCityIdValid = true;
            lastSearchedCityId = id;

            
            if (cityNameDisplay) cityNameDisplay.value = city;
            if (stateInput) stateInput.value = state;
            if (countryInput) countryInput.value = country;

            
            cityDropdown.style.display = "none";
        };
    });
}


function revertCityNameDisplay() {
    const currentId = cityIdInput.value.trim();
    if (currentId !== "") {
        if (citiesList && citiesList.length > 0) {
            const city = citiesList.find(c => String(c[0]) === currentId);
            if (city) {
                if (cityNameDisplay) cityNameDisplay.value = city[3] || "";
                if (stateInput) stateInput.value = city[2] || "";
                if (countryInput) countryInput.value = city[1] || "";
                return;
            }
        }
    }
    if (cityNameDisplay) cityNameDisplay.value = "";
    if (stateInput) stateInput.value = "";
    if (countryInput) countryInput.value = "";
}


function toggleCityDropdown(e) {
    if (e) e.stopPropagation();
    if (!cityDropdown) return;
    if (cityDropdown.style.display === "block") {
        cityDropdown.style.display = "none";
        revertCityNameDisplay();
    } else {
        renderCityDropdown(citiesList);
        cityDropdown.style.display = "block";
    }
}

if (cityNameDisplay) {
    cityNameDisplay.onclick = (e) => {
        if (e) e.stopPropagation();
        if (cityDropdown && cityDropdown.style.display !== "block") {
            renderCityDropdown(citiesList);
            cityDropdown.style.display = "block";
        }
    };
    
    cityNameDisplay.oninput = () => {
        const query = cityNameDisplay.value.toLowerCase().trim();
        if (cityDropdown) {
            cityDropdown.style.display = "block";
        }
        const filtered = citiesList.filter(city => {
            
            const id = String(city[0]).toLowerCase();
            const country = String(city[1]).toLowerCase();
            const state = String(city[2]).toLowerCase();
            const cityName = String(city[3]).toLowerCase();
            return id.includes(query) || country.includes(query) || state.includes(query) || cityName.includes(query);
        });
        renderCityDropdown(filtered);
    };
}

if (cityDropdownArrow) {
    cityDropdownArrow.onclick = toggleCityDropdown;
}


document.addEventListener("click", (e) => {
    if (cityDropdown && cityWrapper && !cityWrapper.contains(e.target)) {
        cityDropdown.style.display = "none";
        revertCityNameDisplay();
    }
});


prevBtn.addEventListener("click", () => {
    confirmLeave(async () => {
        hideMessage();
        if (fetchPromise) await fetchPromise;
        if (areas.length === 0) {
            showMessage("No record found.", "error");
            return;
        }
        if (currentIndex === 0) {
            showMessage(" No previous record", "error");
            return;
        }
        if (currentIndex === -1) {
            currentIndex = areas.length - 1;
            displayArea(areas[currentIndex]);
            setFindButtonState();
            return;
        }
        currentIndex--;
        displayArea(areas[currentIndex]);
        setFindButtonState();
    });
});

nextBtn.addEventListener("click", () => {
    confirmLeave(async () => {
        hideMessage();
        if (fetchPromise) await fetchPromise;
        if (areas.length === 0) {
            showMessage("No record found.", "error");
            return;
        }
        if (currentIndex === areas.length - 1) {
            showMessage("No next record.", "error");
            return;
        }
        if (currentIndex === -1) {
            currentIndex = 0;
            displayArea(areas[currentIndex]);
            setFindButtonState();
            return;
        }
        currentIndex++;
        displayArea(areas[currentIndex]);
        setFindButtonState();
    });
});

async function saveRecord(shouldClearForm = true) {
    const area_id = areaIdInput.value.trim();
    const area_name = areaNameInput.value.trim();
    const city_id = cityIdInput.value.trim();

    if (area_id === "") {
        showMessage("Please enter Area ID", "error");
        areaIdInput.focus();
        return false;
    }
    if (area_name === "") {
        showMessage("Please enter Area Name", "error");
        areaNameInput.focus();
        return false;
    }
    if (city_id === "") {
        showMessage("Please select a City", "error");
        if (cityNameDisplay) cityNameDisplay.focus();
        return false;
    }
    if (!isCityIdValid) {
        showMessage("Invalid City selection", "error");
        if (cityNameDisplay) cityNameDisplay.focus();
        return false;
    }

    try {
        const response = await fetch("http://localhost:3000/area-master", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                area_id,
                area_name,
                city_id
            })
        });

        const result = await response.json();

        if (result.success) {
            showMessage("Saved successfully", "success");
            await fetchAreas();
            if (shouldClearForm) {
                clearForm();
            } else {
                currentIndex = findAreaIndex(area_id);
                if (currentIndex !== -1) {
                    displayArea(areas[currentIndex]);
                }
            }
            return true;
        } else {
            showMessage(result.message || "Error saving record.", "error");
            return false;
        }
    } catch (err) {
        console.error(err);
        showMessage("Server connection failed. Unable to save.", "error");
        return false;
    }
}

async function updateRecord(shouldClearForm = true) {
    const area_id = areaIdInput.value.trim();
    const area_name = areaNameInput.value.trim();
    const city_id = cityIdInput.value.trim();

    if (area_id === "") {
        showMessage("Please enter Area ID.", "error");
        areaIdInput.focus();
        return false;
    }
    if (area_name === "") {
        showMessage("Please enter Area Name.", "error");
        areaNameInput.focus();
        return false;
    }
    if (city_id === "") {
        showMessage("Please select a City.", "error");
        if (cityNameDisplay) cityNameDisplay.focus();
        return false;
    }
    if (!isCityIdValid) {
        showMessage("Please select a valid City.", "error");
        if (cityNameDisplay) cityNameDisplay.focus();
        return false;
    }

    try {
        const response = await fetch(`http://localhost:3000/area-master/${area_id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                area_name,
                city_id
            })
        });

        const result = await response.json();

        if (result.success) {
            showMessage("Updated successfully", "success");
            await fetchAreas();
            if (shouldClearForm) {
                clearForm();
            } else {
                currentIndex = findAreaIndex(area_id);
                if (currentIndex !== -1) {
                    displayArea(areas[currentIndex]);
                }
            }
            return true;
        } else {
            showMessage(result.message || "Error updating record", "error");
            return false;
        }
    } catch (err) {
        console.error(err);
        showMessage("Server connection failed. Unable to update", "error");
        return false;
    }
}

saveBtn.addEventListener("click", async () => {
    await saveRecord();
});

if (updateBtn) {
    updateBtn.addEventListener("click", async () => {
        await updateRecord(false);
    });
}

if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
        const choice = await showModal({
            title: "Delete Record?",
            message: "Do you really want to delete this record?",
            buttons: [
                { text: "Yes", class: "primary", value: "yes" },
                { text: "No", class: "secondary", value: "no" }
            ]
        });

        if (choice === "yes") {
            const area_id = areaIdInput.value.trim();
            if (area_id === "") return;
            try {
                const response = await fetch(`http://localhost:3000/area-master/${area_id}`, {
                    method: "DELETE"
                });
                const result = await response.json();
                if (result.success) {
                    showMessage("Record deleted successfully", "success");
                    await fetchAreas();
                    clearForm();
                } else {
                    showMessage(result.message || "Error deleting record.", "error");
                }
            } catch (err) {
                showMessage("Server connection failed. Unable to delete.", "error");
            }
        }
    });
}

exitBtn.addEventListener("click", () => {
    confirmLeave(() => {
        hideMessage();
        showMessage("Thank you for using House Help Management System", "success");
        setTimeout(() => {
            clearForm();
        }, 1500);
    });
});


window.addEventListener("beforeunload", (e) => {
    if (hasUnsavedChanges() || hasPendingUpdates()) {
        e.preventDefault();
        e.returnValue = "Save changes before continuing?";
        return "Save changes before continuing?";
    }
});
