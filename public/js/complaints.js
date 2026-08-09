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
const complaintIdInput = document.getElementById("complaint_id");
const bookingIdInput = document.getElementById("booking_id");
const customerIdInput = document.getElementById("customer_id");
const statusInput = document.getElementById("status");
const statusWrapper = document.getElementById("statusWrapper");
const statusDropdown = document.getElementById("statusDropdown");
const descriptionInput = document.getElementById("description");
const saveBtn = document.getElementById("saveBtn");
const updateBtn = document.getElementById("updateBtn");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const exitBtn = document.getElementById("exitBtn");

const findBtn = document.getElementById("findBtn");

const confirmBox = document.getElementById("confirmBox");
const yesExit = document.getElementById("yesExit");
const noExit = document.getElementById("noExit");
let complaints = [];
let currentIndex = -1;
let fetchPromise = null;
let originalRecord = null;
let isFetchingNextId = false;
let isAutoFilling = false;
let searchAbortController = null;
let lastSearchedId = "";
async function fetchComplaints() {
    try {
        const response = await fetch("http://localhost:5000/complaints");
        const data = await response.json();
        
        complaints = data;
        complaints.sort((a, b) => Number(a[0]) - Number(b[0]));
    } catch (err) {
        console.error("Error loading complaints list:", err);
    }
}
function getFormattedCustomerId(id) {
    if (id === null || id === undefined) return "";
    const cid = String(id).trim().split(" - ")[0].trim();
    if (cid === "") return "";
    const customer = customers.find(c => String(c.customer_id) === cid);
    if (customer && customer.customer_name) {
        return `${cid} - ${customer.customer_name}`;
    }
    return cid;
}
function getFormattedBookingId(id) {
    if (id === null || id === undefined) return "";
    const bid = String(id).trim();
    if (bid === "") return "";
    const booking = bookings.find(b => String(b.booking_id) === bid);
    if (booking && booking.category_name) {
        return `${bid} - ${booking.category_name}`;
    }
    return bid;
}



function displayComplaint(complaintRow) {
    if (!complaintRow) return;
    complaintIdInput.readOnly = false;
    complaintIdInput.removeAttribute("readonly");
    complaintIdInput.value = complaintRow[0];
    bookingIdInput.value = getFormattedBookingId(complaintRow[1] || "");
    customerIdInput.value = getFormattedCustomerId(complaintRow[2] || "");
    descriptionInput.value = complaintRow[3] || "";
    statusInput.value = complaintRow[4] || "";
    updateStatusPlaceholderStyle();
    handleStatusChange(); 
    originalRecord = {
        complaint_id: String(complaintRow[0]),
        booking_id: String(complaintRow[1] || ""),
        customer_id: String(complaintRow[2] || ""),
        description: complaintRow[3] || "",
        status: complaintRow[4] || ""
    };

    lastSearchedId = String(complaintRow[0]);

    if (findBtn) {
        findBtn.innerText = "New";
    }
}
function resetButtonState() {
    if (saveBtn) saveBtn.style.display = "inline-block";
    if (updateBtn) updateBtn.style.display = "none";
    if (prevBtn) prevBtn.style.display = "inline-block";
    if (nextBtn) nextBtn.style.display = "none";
    
    if (statusInput) {
        statusInput.value = "Open";
    }
    updateStatusPlaceholderStyle();
    handleStatusChange();
}

function setFindButtonState() {
    if (saveBtn) saveBtn.style.display = "none";
    if (updateBtn) updateBtn.style.display = "inline-block";
    if (prevBtn) prevBtn.style.display = "inline-block";
    if (nextBtn) nextBtn.style.display = "inline-block";
    
    if (statusInput && !originalRecord) {
        statusInput.value = "";
    }
    updateStatusPlaceholderStyle();
    handleStatusChange();
}


function clearForm(shouldFocus = true) {
    if (searchAbortController) {
        searchAbortController.abort();
        searchAbortController = null;
    }
    complaintIdInput.readOnly = true;
    complaintIdInput.setAttribute("readonly", "readonly");
    complaintIdInput.value = "";
    bookingIdInput.value = "";
    customerIdInput.value = "";
    if (statusInput) {
        statusInput.value = "Open";
    }
    updateStatusPlaceholderStyle();
    descriptionInput.value = "";
    originalRecord = null;
    currentIndex = -1;
    lastSearchedId = "";
    resetButtonState();
    if (shouldFocus) {
        complaintIdInput.focus();
    }
    if (findBtn) findBtn.innerText = "Find";

    
    fetchNextComplaintId();
}


function findComplaintIndex(id) {
    return complaints.findIndex(c => c[0] == id);
}


window.addEventListener("DOMContentLoaded", async () => {
    fetchPromise = fetchComplaints();
    const bookingsPromise = fetchBookings();
    const customersPromise = fetchCustomers();
    const statusPromise = fetchStatusLOV();

    await Promise.all([
        fetchPromise,
        bookingsPromise,
        customersPromise,
        statusPromise
    ]);
    
    clearForm(false);
    if (statusInput) {
        statusInput.addEventListener("input", handleStatusChange);
        statusInput.addEventListener("change", handleStatusChange);
        statusInput.addEventListener("change", updateStatusPlaceholderStyle);
        updateStatusPlaceholderStyle();
    }
});

async function fetchStatusLOV() {
    try {
        const response = await fetch("http://localhost:5000/lov/complaint-status");
        statusLOV = await response.json();
        populateStatusDropdown(statusLOV);
    } catch (err) {
        console.error("Error fetching status LOV:", err);
    }
}

function populateStatusDropdown(list) {
    const tbody = document.getElementById("statusDropdownBody");
    if (!tbody) return;
    tbody.innerHTML = list.map(item => `
        <tr data-val="${item.value}">
            <td>${item.value}</td>
        </tr>
    `).join("");
    
    tbody.querySelectorAll("tr").forEach(tr => {
        tr.onclick = (e) => {
            e.stopPropagation();
            const val = tr.getAttribute("data-val");
            statusInput.value = val;
            statusInput.dispatchEvent(new Event("input"));
            statusInput.dispatchEvent(new Event("change"));
            statusDropdown.style.display = "none";
        };
    });
}


async function searchComplaintById(id) {
    const trimmedId = String(id).trim();
    if (trimmedId === "") return;
    if (trimmedId === lastSearchedId) return;
    lastSearchedId = trimmedId;
    const index = findComplaintIndex(trimmedId);
    if (index !== -1) {
        displayComplaint(complaints[index]);
        currentIndex = index;
        setFindButtonState();
        return;
    }
    bookingIdInput.value = "";
    customerIdInput.value = "";
    statusInput.value = "Open";
    descriptionInput.value = "";
    setFindButtonState();
    if (findBtn) findBtn.innerText = "New";
    complaintIdInput.readOnly = false;
    complaintIdInput.removeAttribute("readonly");
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
            
            complaintIdInput.readOnly = false;
            complaintIdInput.removeAttribute("readonly");
            complaintIdInput.value = "";
            bookingIdInput.value = "";
            customerIdInput.value = "";
            statusInput.value = "Open";
            descriptionInput.value = "";
            originalRecord = null;
            currentIndex = -1;
            lastSearchedId = "";
            
            if (findBtn) findBtn.innerText = "New";
            setFindButtonState();
            complaintIdInput.focus();
            return;
        }

        const id = complaintIdInput.value.trim();

        if (id === "") {
            await fetchComplaints();
            if (complaints.length === 0) {
                showMessage("No record found.", "error");
                return;
            }
            currentIndex = -1;
            if (findBtn) findBtn.innerText = "New";
            setFindButtonState();
            return;
        }

        await searchComplaintById(id);
    });
});



async function fetchNextComplaintId() {
    const isNewMode = (saveBtn && saveBtn.style.display !== "none");
    if (!isNewMode || complaintIdInput.value.trim() !== "" || isFetchingNextId) return;

    isFetchingNextId = true;
    try {
        const response = await fetch("http://localhost:5000/complaints/next-id");
        const result = await response.json();
        if (result.success && complaintIdInput.value.trim() === "") {
            isAutoFilling = true;
            complaintIdInput.value = result.nextId;
            complaintIdInput.dispatchEvent(new Event("input"));
        }
    } catch (err) {
        console.error("Error fetching next complaint ID:", err);
    } finally {
        isFetchingNextId = false;
    }
}

complaintIdInput.addEventListener("click", fetchNextComplaintId);
complaintIdInput.addEventListener("focus", fetchNextComplaintId);


function hasUnsavedChanges() {
    const isNewRecordMode = (saveBtn && saveBtn.style.display !== "none");
    if (isNewRecordMode) {
        return (bookingIdInput.value.trim() !== "" || 
                customerIdInput.value.trim() !== "" ||
                statusInput.value !== "Open" ||
                descriptionInput.value.trim() !== "");
    }
    return false;
}

function hasPendingUpdates() {
    const isUpdateMode = (updateBtn && updateBtn.style.display !== "none");
    if (isUpdateMode && originalRecord) {
        const rawBookingId = bookingIdInput.value.trim().split(" - ")[0].trim();
        const rawCustomerId = customerIdInput.value.trim().split(" - ")[0].trim();
        return (rawBookingId !== originalRecord.booking_id ||
                rawCustomerId !== originalRecord.customer_id ||
                statusInput.value !== originalRecord.status ||
                descriptionInput.value.trim() !== originalRecord.description);
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

let lookupTimeout = null;


complaintIdInput.addEventListener("input", () => {
    hideMessage();
    if (lookupTimeout) {
        clearTimeout(lookupTimeout);
    }

    if (isAutoFilling) {
        isAutoFilling = false;
        return;
    }

    
    
    const hasFieldsFilled = (bookingIdInput.value.trim() !== "" || 
                            customerIdInput.value.trim() !== "" || 
                            statusInput.value !== "Open" || 
                            descriptionInput.value.trim() !== "");
    const isModified = hasPendingUpdates();
    if ((hasFieldsFilled && !originalRecord) || isModified) {
        return;
    }

    const id = complaintIdInput.value.trim();
    if (id === "") {
        if (searchAbortController) {
            searchAbortController.abort();
            searchAbortController = null;
        }
        bookingIdInput.value = "";
        customerIdInput.value = "";
        statusInput.value = "Open";
        descriptionInput.value = "";
        originalRecord = null;

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

    
    bookingIdInput.value = "";
    customerIdInput.value = "";
    statusInput.value = "Open";
    descriptionInput.value = "";
    originalRecord = null;

    
    const index = findComplaintIndex(id);
    if (index !== -1) {
        if (searchAbortController) {
            searchAbortController.abort();
            searchAbortController = null;
        }
        displayComplaint(complaints[index]);
        currentIndex = index;
        setFindButtonState();
        return;
    }

    
    lookupTimeout = setTimeout(async () => {
        await searchComplaintById(id);
    }, 2000);
});


complaintIdInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        const id = complaintIdInput.value.trim();
        if (id !== "") {
            confirmLeave(async () => {
                if (lookupTimeout) {
                    clearTimeout(lookupTimeout);
                }
                await searchComplaintById(id);
            });
        }
    }
});


prevBtn.addEventListener("click", () => {
    confirmLeave(async () => {
        hideMessage();
        if (fetchPromise) await fetchPromise;
        if (complaints.length === 0) {
            showMessage("No record found.", "error");
            return;
        }
        if (currentIndex === 0) {
            showMessage("No previous record.", "error");
            return;
        }
        if (currentIndex === -1) {
            currentIndex = complaints.length - 1;
            displayComplaint(complaints[currentIndex]);
            setFindButtonState();
            return;
        }
        currentIndex--;
        displayComplaint(complaints[currentIndex]);
        setFindButtonState();
    });
});


nextBtn.addEventListener("click", () => {
    confirmLeave(async () => {
        hideMessage();
        if (fetchPromise) await fetchPromise;
        if (complaints.length === 0) {
            showMessage("No record found.", "error");
            return;
        }
        if (currentIndex === complaints.length - 1) {
            showMessage("No next record.", "error");
            return;
        }
        if (currentIndex === -1) {
            currentIndex = 0;
            displayComplaint(complaints[currentIndex]);
            setFindButtonState();
            return;
        }
        currentIndex++;
        displayComplaint(complaints[currentIndex]);
        setFindButtonState();
    });
});


async function saveRecord(shouldClearForm = true) {
    const complaint_id = complaintIdInput.value.trim();
    const bookingIdVal = bookingIdInput.value.trim();
    const booking_id = bookingIdVal.split(" - ")[0].trim();
    const customerIdVal = customerIdInput.value.trim();
    const customer_id = customerIdVal.split(" - ")[0].trim();
    const description = descriptionInput.value.trim();
    const status = statusInput.value || "Open";

    if (complaint_id === "") {
        showMessage("Please enter Complaint ID.", "error");
        complaintIdInput.focus();
        return false;
    }
    if (booking_id === "") {
        showMessage("Please enter Booking ID.", "error");
        bookingIdInput.focus();
        return false;
    }
    if (customer_id === "") {
        showMessage("Please enter Customer ID.", "error");
        customerIdInput.focus();
        return false;
    }
    if (description === "") {
        showMessage("Please enter Description.", "error");
        descriptionInput.focus();
        return false;
    }

    try {
        const response = await fetch("http://localhost:5000/complaints", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                complaint_id,
                booking_id,
                customer_id,
                description,
                status
            })
        });

        const result = await response.json();

        if (result.success) {
            showMessage("Saved successfully.", "success");
            await fetchComplaints();
            if (shouldClearForm) {
                clearForm();
            } else {
                currentIndex = findComplaintIndex(complaint_id);
                if (currentIndex !== -1) {
                    displayComplaint(complaints[currentIndex]);
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
    const complaint_id = complaintIdInput.value.trim();
    const bookingIdVal = bookingIdInput.value.trim();
    const booking_id = bookingIdVal.split(" - ")[0].trim();
    const customerIdVal = customerIdInput.value.trim();
    const customer_id = customerIdVal.split(" - ")[0].trim();
    const description = descriptionInput.value.trim();
    const status = statusInput.value;

    if (complaint_id === "") {
        showMessage("Please enter Complaint ID.", "error");
        complaintIdInput.focus();
        return false;
    }
    if (booking_id === "") {
        showMessage("Please enter Booking ID.", "error");
        bookingIdInput.focus();
        return false;
    }
    if (customer_id === "") {
        showMessage("Please enter Customer ID.", "error");
        customerIdInput.focus();
        return false;
    }
    if (status === "") {
        showMessage("Please select Status.", "error");
        statusInput.focus();
        return false;
    }
    if (description === "") {
        showMessage("Please enter Description.", "error");
        descriptionInput.focus();
        return false;
    }

    try {
        const response = await fetch(`http://localhost:5000/complaints/${complaint_id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                booking_id,
                customer_id,
                description,
                status
            })
        });

        const result = await response.json();

        if (result.success) {
            showMessage("Updated successfully.", "success");
            await fetchComplaints();
            if (shouldClearForm) {
                clearForm();
            } else {
                currentIndex = findComplaintIndex(complaint_id);
                if (currentIndex !== -1) {
                    displayComplaint(complaints[currentIndex]);
                }
            }
            return true;
        } else {
            showMessage(result.message || "Error updating record.", "error");
            return false;
        }
    } catch (err) {
        console.error(err);
        showMessage("Server connection failed. Unable to update.", "error");
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


exitBtn.addEventListener("click", () => {
    confirmLeave(() => {
        confirmBox.style.display = "block";
    });
});

yesExit.addEventListener("click", () => {
    confirmBox.style.display = "none";
    showMessage("Thank you for using House Help Management System.", "success");
    setTimeout(() => {
        clearForm();
    }, 1500);
});

noExit.addEventListener("click", () => {
    confirmBox.style.display = "none";
});




let bookings = [];
let customers = [];
let statusLOV = [];

async function fetchBookings() {
    try {
        const response = await fetch("http://localhost:5000/bookings");
        bookings = await response.json();
        populateBookingDropdown(bookings);
    } catch (err) {
        console.error("Error fetching bookings:", err);
    }
}

async function fetchCustomers() {
    try {
        const response = await fetch("http://localhost:5000/customers");
        customers = await response.json();
        populateCustomerDropdown(customers);
        if (customerIdInput && customerIdInput.value.trim() !== "") {
            customerIdInput.value = getFormattedCustomerId(customerIdInput.value);
        }
    } catch (err) {
        console.error("Error fetching customers:", err);
    }
}

function populateBookingDropdown(list) {
    const tbody = document.getElementById("bookingDropdownBody");
    if (!tbody) return;
    tbody.innerHTML = list.map(item => `
        <tr data-id="${item.booking_id}">
            <td>${item.booking_id}</td>
            <td>${item.customer_name}</td>
            <td>${item.category_name}</td>
            <td>${item.service_date}</td>
            <td>${item.booking_status}</td>
            <td>${item.address}</td>
        </tr>
    `).join("");

    tbody.querySelectorAll("tr").forEach(tr => {
        tr.onclick = async (e) => {
            e.stopPropagation();
            const bookingId = tr.getAttribute("data-id");
            bookingIdInput.value = getFormattedBookingId(bookingId);
            bookingIdInput.dispatchEvent(new Event("input"));
            bookingIdInput.dispatchEvent(new Event("change"));
            document.getElementById("bookingDropdown").style.display = "none";

            
            try {
                const response = await fetch(`http://localhost:5000/bookings/${bookingId}`);
                const result = await response.json();
                if (result.success && result.data) {
                    customerIdInput.value = getFormattedCustomerId(result.data.customer_id);
                    customerIdInput.dispatchEvent(new Event("input"));
                    customerIdInput.dispatchEvent(new Event("change"));
                }
            } catch (err) {
                console.error("Error fetching booking detail for customer ID:", err);
            }
        };
    });
}

function populateCustomerDropdown(list) {
    const tbody = document.getElementById("customerDropdownBody");
    if (!tbody) return;
    tbody.innerHTML = list.map(item => `
        <tr data-id="${item.customer_id}">
            <td>${item.customer_id}</td>
            <td>${item.customer_name}</td>
        </tr>
    `).join("");

    tbody.querySelectorAll("tr").forEach(tr => {
        tr.onclick = (e) => {
            e.stopPropagation();
            const customerId = tr.getAttribute("data-id");
            customerIdInput.value = getFormattedCustomerId(customerId);
            customerIdInput.dispatchEvent(new Event("input"));
            customerIdInput.dispatchEvent(new Event("change"));
            document.getElementById("customerDropdown").style.display = "none";
        };
    });
}


const bookingWrapper = document.getElementById("bookingWrapper");
const bookingDropdown = document.getElementById("bookingDropdown");
const customerWrapper = document.getElementById("customerWrapper");
const customerDropdown = document.getElementById("customerDropdown");

function adjustDropdownPosition() {
    if (!bookingWrapper || !bookingDropdown) return;
    
    
    bookingDropdown.style.left = "0px";
    bookingDropdown.style.right = "auto";
    
    const rect = bookingWrapper.getBoundingClientRect();
    const dropdownWidth = bookingDropdown.offsetWidth || 800;
    const viewportWidth = window.innerWidth;
    
    
    bookingDropdown.style.maxWidth = `${viewportWidth - 20}px`;
    
    
    if (rect.left + dropdownWidth > viewportWidth) {
        
        const rightAlignedLeft = rect.right - dropdownWidth;
        if (rightAlignedLeft >= 10) {
            
            const relativeLeft = rect.width - dropdownWidth;
            bookingDropdown.style.left = `${relativeLeft}px`;
        } else {
            
            const relativeLeft = 10 - rect.left;
            bookingDropdown.style.left = `${relativeLeft}px`;
        }
    }
}

window.addEventListener("resize", () => {
    if (bookingDropdown && bookingDropdown.style.display === "block") {
        adjustDropdownPosition();
    }
    if (statusDropdown && statusDropdown.style.display === "block") {
        adjustStatusDropdownPosition();
    }
});

if (bookingIdInput && bookingDropdown) {
    bookingIdInput.onclick = (e) => {
        e.stopPropagation();
        if (customerDropdown) customerDropdown.style.display = "none";
        if (statusDropdown) statusDropdown.style.display = "none";
        if (bookingDropdown.style.display === "none" || bookingDropdown.style.display === "") {
            bookingDropdown.style.display = "block";
            adjustDropdownPosition();
        } else {
            bookingDropdown.style.display = "none";
        }
    };
}

if (customerIdInput && customerDropdown) {
    customerIdInput.onclick = (e) => {
        e.stopPropagation();
        
    };
}

if (statusInput && statusDropdown) {
    statusInput.onclick = (e) => {
        e.stopPropagation();
        if (bookingDropdown) bookingDropdown.style.display = "none";
        if (customerDropdown) customerDropdown.style.display = "none";
        if (statusDropdown.style.display === "none" || statusDropdown.style.display === "") {
            statusDropdown.style.display = "block";
            adjustStatusDropdownPosition();
        } else {
            statusDropdown.style.display = "none";
        }
    };
}

function adjustStatusDropdownPosition() {
    if (!statusWrapper || !statusDropdown) return;
    statusDropdown.style.left = "0px";
    statusDropdown.style.right = "auto";
    const rect = statusWrapper.getBoundingClientRect();
    const dropdownWidth = statusDropdown.offsetWidth || 140;
    const viewportWidth = window.innerWidth;
    statusDropdown.style.maxWidth = `${viewportWidth - 20}px`;
    if (rect.left + dropdownWidth > viewportWidth) {
        const rightAlignedLeft = rect.right - dropdownWidth;
        if (rightAlignedLeft >= 10) {
            const relativeLeft = rect.width - dropdownWidth;
            statusDropdown.style.left = `${relativeLeft}px`;
        } else {
            const relativeLeft = 10 - rect.left;
            statusDropdown.style.left = `${relativeLeft}px`;
        }
    }
}


document.addEventListener("click", (e) => {
    if (bookingDropdown && !bookingWrapper.contains(e.target)) {
        bookingDropdown.style.display = "none";
    }
    if (customerDropdown && !customerWrapper.contains(e.target)) {
        customerDropdown.style.display = "none";
    }
    if (statusDropdown && !statusWrapper.contains(e.target)) {
        statusDropdown.style.display = "none";
    }
});


function handleStatusChange() {
    if (!statusInput || !bookingIdInput || !descriptionInput) return;
    const status = statusInput.value;
    if (status === "Closed") {
        bookingIdInput.readOnly = true;
        bookingIdInput.style.backgroundColor = "#f1eff7";
        bookingIdInput.style.cursor = "not-allowed";
        bookingIdInput.style.pointerEvents = "none";
        
        descriptionInput.readOnly = true;
        descriptionInput.style.backgroundColor = "#f1eff7";
        descriptionInput.style.cursor = "not-allowed";
    } else {
        bookingIdInput.readOnly = true; 
        bookingIdInput.style.backgroundColor = "#ffffff";
        bookingIdInput.style.cursor = "pointer";
        bookingIdInput.style.pointerEvents = "auto";
        
        descriptionInput.readOnly = false;
        descriptionInput.style.backgroundColor = "#ffffff";
        descriptionInput.style.cursor = "text";
    }
}


function updateStatusPlaceholderStyle() {
    if (statusInput) {
        if (statusInput.value === "") {
            statusInput.classList.add("placeholder-active");
        } else {
            statusInput.classList.remove("placeholder-active");
        }
    }
}


if (statusInput) {
    statusInput.dispatchEvent(new Event("change"));
}
