const storageKey = "snipper-de-cypher-payments";
const loginKey = "snipper-de-cypher-login";
const loginScreen = document.getElementById("login-screen");
const appShell = document.getElementById("app-shell");
const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");
const logoutButton = document.getElementById("logout-button");
const togglePasswordButton = document.getElementById("toggle-password");
const passwordInput = document.getElementById("password");
const paymentForm = document.getElementById("payment-form");
const paymentRecords = document.getElementById("payment-records");
const totalStudents = document.getElementById("total-students");
const totalAmount = document.getElementById("total-amount");
const formMessage = document.getElementById("form-message");
const addButton = paymentForm.querySelector(".add-btn");

let storageReady = true;

function showApp() {
    loginScreen.hidden = true;
    appShell.hidden = false;
}

function showLogin() {
    appShell.hidden = true;
    loginScreen.hidden = false;
    loginForm.reset();
    loginMessage.textContent = "";
    document.getElementById("username").focus();
}

if (sessionStorage.getItem(loginKey) === "true") {
    showApp();
} else {
    showLogin();
}

loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);
    const username = formData.get("username").trim();
    const password = formData.get("password");

    if (username === "admin" && password === "admin123") {
        sessionStorage.setItem(loginKey, "true");
        loginMessage.textContent = "";
        showApp();
        return;
    }

    loginMessage.textContent = "Invalid username or password.";
});

togglePasswordButton.addEventListener("click", () => {
    const showPassword = passwordInput.type === "password";
    passwordInput.type = showPassword ? "text" : "password";
    togglePasswordButton.setAttribute("aria-label", showPassword ? "Hide password" : "Show password");
    togglePasswordButton.innerHTML = showPassword
        ? '<i class="fa-solid fa-eye-slash"></i>'
        : '<i class="fa-solid fa-eye"></i>';
});

logoutButton.addEventListener("click", () => {
    sessionStorage.removeItem(loginKey);
    showLogin();
});

function showMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = type ? `form-message ${type}` : "form-message";
}

function loadPayments() {
    try {
        const savedPayments = localStorage.getItem(storageKey);

        if (savedPayments === null) {
            return [];
        }

        const parsedPayments = JSON.parse(savedPayments);
        const isValid = Array.isArray(parsedPayments) && parsedPayments.every((payment) =>
            payment &&
            typeof payment.studentId === "string" &&
            typeof payment.name === "string" &&
            Number.isFinite(payment.amount) &&
            payment.amount > 0 &&
            typeof payment.contact === "string" &&
            typeof payment.date === "string" &&
            typeof payment.time === "string"
        );

        if (!isValid) {
            throw new Error("Saved payment data has an invalid format.");
        }

        return parsedPayments;
    } catch (error) {
        console.error("Could not load saved payment records.", error);
        storageReady = false;
        addButton.disabled = true;
        showMessage("Saved records could not be loaded. Check browser storage or clear the saved site data.", "error");
        return [];
    }
}

function savePayments(payments) {
    try {
        localStorage.setItem(storageKey, JSON.stringify(payments));
        return true;
    } catch (error) {
        console.error("Could not save payment records.", error);
        showMessage("Record was not saved. Check browser storage settings or available space.", "error");
        return false;
    }
}

function formatDate(date) {
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
}

function renderPayments() {
    paymentRecords.replaceChildren();

    if (!storageReady || payments.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 6;
        cell.textContent = storageReady ? "No payment records yet." : "Payment records unavailable.";
        row.append(cell);
        paymentRecords.append(row);
    }

    if (!storageReady) {
        totalStudents.textContent = "—";
        totalAmount.textContent = "—";
        return;
    }

    payments.forEach((payment) => {
        const row = document.createElement("tr");
        const values = [
            payment.studentId,
            payment.name,
            `GH₵ ${payment.amount.toLocaleString("en-GH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`,
            payment.contact,
            formatDate(payment.date),
            payment.time
        ];

        values.forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.append(cell);
        });

        paymentRecords.append(row);
    });

    const studentIds = new Set(
        payments.map((payment) => payment.studentId.trim().toUpperCase())
    );
    const collected = payments.reduce((sum, payment) => sum + payment.amount, 0);

    totalStudents.textContent = studentIds.size.toLocaleString("en-GH");
    totalAmount.textContent = `GH₵ ${collected.toLocaleString("en-GH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

let payments = loadPayments();
renderPayments();

paymentForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!storageReady) {
        return;
    }

    const formData = new FormData(paymentForm);
    const payment = {
        studentId: formData.get("studentId").trim(),
        name: formData.get("name").trim(),
        time: formData.get("time"),
        amount: Number(formData.get("amount")),
        contact: formData.get("contact").trim(),
        date: formData.get("date")
    };

    if (!payment.studentId || !payment.name || !payment.contact || !payment.date ||
        !payment.time || !Number.isFinite(payment.amount) || payment.amount <= 0) {
        showMessage("Enter valid information in all fields. Amount must be greater than zero.", "error");
        return;
    }

    const updatedPayments = [payment, ...payments];

    if (!savePayments(updatedPayments)) {
        return;
    }

    payments = updatedPayments;
    renderPayments();
    paymentForm.reset();
    showMessage("Payment record added.", "success");
});

paymentForm.addEventListener("reset", () => {
    showMessage("", "");
});
