# Dialog.html - Google Sheet Password Encryption/Decryption Dialog Interface

This HTML file defines the user interface (UI) and all client-side JavaScript logic for the modal dialog that appears within a Google Sheet. This dialog is the interactive component of the "Password Manager" tool, allowing users to encrypt the content of a selected cell (typically a password) to be stored in the sheet, or to decrypt and view the content of an already encrypted cell without modifying the sheet. The dialog is served by the `showEncryptDecryptDialog()` function in the corresponding `Code.gs` file, utilizing Google Apps Script's `HtmlService`.

---

## Overview

The `Dialog.html` page provides a focused, secure interface for users to:
-   View the current (often encrypted) value from the selected spreadsheet cell, along with its A1 notation.
-   Input a secret key or passphrase, which is essential for all cryptographic operations.
-   Perform client-side AES encryption on the original cell value using the provided key, and then send this encrypted ciphertext back to `Code.gs` to update the cell in the spreadsheet.
-   Perform client-side AES decryption of the cell's current value using the key, and display the resulting plaintext *exclusively within the dialog* for viewing purposes. The original encrypted data in the spreadsheet cell remains unchanged in this "view only" mode.
-   Conveniently copy the decrypted plaintext password to the clipboard.
-   Receive immediate visual feedback on the status of operations (e.g., success, failure, loading) through messages and a loader animation.

A core security principle of this dialog is that all cryptographic operations involving the secret key and the sensitive plaintext/ciphertext are performed locally in the user's browser. The secret key itself is never transmitted to the Google Apps Script server-side code.

---

## HTML Structure

The dialog's content is primarily organized within a main `<div class="dialog-content">`. Key UI elements include:

-   **Current Value Display Section:**
    -   A `<label>` indicating "Encrypted Value from Cell (<span id="cellA1NotationSpan"></span>):". The `<span>` (with `id="cellA1NotationSpan"`) is dynamically populated with the A1 notation (e.g., "C2") of the selected cell from the spreadsheet.
    -   A `<div>` with `id="currentValueDisplay"` which shows the (read-only) current string value fetched from the selected spreadsheet cell. This is typically the ciphertext if the cell is already encrypted.
-   **Secret Key Input Section:**
    -   A `<label for="secretKeyInput">` prompting for the "Secret Key / Passphrase:".
    -   An `<input type="password" id="secretKeyInput">` field where the user enters their secret passphrase.
-   **Status and Loader Section:**
    -   A `<div id="status">` used to display dynamic feedback messages (e.g., "Encryption successful!", "Decryption failed - incorrect key.") to the user. This element is hidden by default.
    -   A `<div id="loader" class="loader">` which shows a CSS-animated spinner during potentially long operations like server communication, providing visual feedback that processing is underway. This is also hidden by default.
-   **Decrypted Password Section (View Only) (`<div id="decryptedPasswordSection">`):**
    -   This entire section is hidden by default (`style="display:none;"`) and only becomes visible after a successful "View Decrypted" operation.
    -   It contains a `<label for="decryptedPasswordOutput">` indicating "Decrypted Password (View Only):".
    -   A read-only `<textarea id="decryptedPasswordOutput">` where the decrypted plaintext password is displayed.
    -   A "Copy Decrypted Password" button (`<button class="copy-button" id="copyDecryptedButton">`) for easily copying the displayed plaintext.
-   **Main Action Buttons (`<div class="button-group">`):**
    -   **Close Button (`<button class="cancel-btn" id="cancelButton">`):** Labeled "Close". When clicked, it executes `google.script.host.close()` to dismiss the modal dialog.
    -   **View Decrypted Button (`<button class="decrypt-btn" id="decryptButton">`):** Labeled "View Decrypted". Triggers the client-side decryption of the `initialCellValue` and displays it in the `#decryptedPasswordOutput` area without modifying the spreadsheet.
    -   **Encrypt & Update Cell Button (`<button class="encrypt-btn" id="encryptButton">`):** Labeled "Encrypt & Update Cell". Triggers the client-side encryption of the `initialCellValue` and then sends the resulting ciphertext to the server-side `updateCellContent` function in `Code.gs` to update the selected spreadsheet cell.

---

## CSS Styling (Embedded in `<style>` tags)

The visual appearance of the dialog is defined by CSS rules embedded within `<style>` tags in the `<head>` section.
-   **Layout & General Appearance:** The dialog uses a clean, modern design with a light background (`#f8f9fa`). Content is arranged vertically using Flexbox within `.dialog-content`. `overscroll-behavior: none;` is used to prevent page scroll interference on some devices.
-   **Typography and Colors:** A system font stack (Arial, sans-serif) is used for readability. Specific colors are assigned for text, backgrounds, and interactive elements. Buttons are styled with distinct colors for different actions (green for encrypt, blue for decrypt, grey for close/cancel, light blue for copy).
-   **Form Elements:** Input fields (`input[type="password"]`) and text areas (`#currentValueDisplay`, `#decryptedPasswordOutput`) are styled for consistency with padding, borders, and rounded corners. `box-sizing: border-box;` ensures predictable sizing.
-   **Feedback Elements:** The `#status` div has distinct styles for success and error messages. The `#loader` div implements a CSS-animated spinner. The `#decryptedPasswordSection` has a light yellow background and an amber border to make it visually distinct when it appears.
-   **Button Styling:** Buttons have common padding, border-radius, and font styling, with specific background colors for their roles. Hover effects and a disabled state (reduced opacity, `not-allowed` cursor) are defined.

---

## JavaScript Logic (Embedded in `<script>` tags)

All client-side interactivity, cryptographic processing, and communication with the server-side `Code.gs` script are handled by JavaScript code within the `<script>` block at the end of the `<body>`.

### Data Received from `Code.gs` (Server-Side):
When the dialog is created and served by `HtmlService` from `Code.gs`, several pieces of data are passed into the HTML template and made available to the client-side JavaScript using printing scriptlets (`<?!= ... ?>`):
-   `initialCellValue` (String): The current string value from the selected spreadsheet cell. `JSON.stringify()` is used in the scriptlet to ensure this is correctly embedded as a JavaScript string, handling any special characters.
-   `cellRow` (Number): The 1-indexed row number of the selected cell.
-   `cellCol` (Number): The 1-indexed column number of the selected cell.
-   `cellA1` (String): The A1 notation of the selected cell (e.g., "C2"). `JSON.stringify()` is also used here.

These variables are then used to initialize the dialog's display and provide context for operations.

### Key JavaScript Variables:
-   Constants hold references to various DOM elements (e.g., `currentValueDisplay`, `secretKeyInput`, `encryptButton`, `decryptedPasswordOutput`, `statusDiv`, `loaderDiv`) for easy manipulation.

### Core Client-Side Functions:

-   **`showStatus(message, isError = false)`**
    * **Purpose:** Displays feedback messages (success or error) to the user in the `#status` div.
    * **Action:** Sets the `textContent` of `statusDiv` and applies the appropriate CSS class (`status-success` or `status-error`). Non-error messages are automatically cleared after a 3-second delay by calling `clearStatus()`.

-   **`clearStatus()`**
    * **Purpose:** Clears non-error status messages from the `#status` div.
    * **Action:** If the `statusDiv` is not currently displaying an error, its text is cleared, and it's hidden.

-   **`setLoadingState(isLoading)`**
    * **Purpose:** Manages the UI state during potentially blocking operations (like crypto processing or server calls).
    * **Action:** If `isLoading` is `true`, it displays the CSS loader animation and disables the "Encrypt", "Decrypt", and "Secret Key" input field. If `isLoading` is `false`, it hides the loader and re-enables these elements. The "Close" button remains enabled.

-   **`processText(isEncryptAction)`**
    * **Purpose:** This is the main function that handles the logic for both encryption and decryption actions initiated by button clicks.
    * **Parameters:**
        * `isEncryptAction` (Boolean): `true` if the "Encrypt & Update Cell" button was clicked; `false` if the "View Decrypted" button was clicked.
    * **Action Flow:**
        1.  Clears any previous status message and hides the `decryptedPasswordSection`.
        2.  Retrieves the `key` from the `secretKeyInput`. Validates that a key has been entered; if not, displays an error and exits.
        3.  Checks if `initialCellValue` (the text to process, from the spreadsheet cell) is empty. If so, displays a message and exits, as there's nothing to encrypt or decrypt.
        4.  Activates the loading state (`setLoadingState(true)`).
        5.  Uses `setTimeout` with a minimal delay (50ms). This allows the browser's UI thread to update (e.g., show the loader) before potentially CPU-intensive cryptographic operations begin.
        6.  **If `isEncryptAction` is `true` (Encrypt & Update Cell):**
            * Encrypts `initialCellValue` using `CryptoJS.AES.encrypt(textToProcess, key).toString()`.
            * If encryption unexpectedly results in an empty string for a non-empty input, an error is thrown.
            * Calls the server-side `updateCellContent(processedText, cellRow, cellCol)` function in `Code.gs` using `google.script.run`.
                * `withSuccessHandler(response)`: If the server reports success in updating the sheet, the dialog is closed using `google.script.host.close()`. Otherwise, an error message from the server is displayed.
                * `withFailureHandler(error)`: If the call to the server-side function itself fails, an error message is displayed.
            * The loading state is reset in both handlers.
        7.  **If `isEncryptAction` is `false` (View Decrypted):**
            * It performs a basic check to see if `initialCellValue` starts with `"U2FsdGVkX1"`. This is a common prefix for strings encrypted by CryptoJS AES when a passphrase is used, indicating it's likely a valid ciphertext for this method. If the prefix is missing, a warning is shown.
            * Decrypts `initialCellValue` using `CryptoJS.AES.decrypt(textToProcess, key)` and then converts the result to a UTF-8 string using `bytes.toString(CryptoJS.enc.Utf8)`.
            * Deactivates the loading state (`setLoadingState(false)`).
            * If decryption is successful and `processedText` is not empty:
                * The `processedText` (decrypted password) is displayed in the `decryptedPasswordOutput` textarea.
                * The `decryptedPasswordSection` is made visible (`style.display = 'block'`).
                * A success message is shown, emphasizing that this is for "view only".
            * If decryption fails (e.g., wrong key, resulting in empty `processedText`), an appropriate error message is shown.
            * **Crucially, in this path, `google.script.run.updateCellContent(...)` is NOT called, leaving the spreadsheet cell unmodified.**
        8.  A `catch` block handles any other exceptions during the crypto operations or logic, resets the loading state, and displays an error message.

### Event Listeners:
-   An event listener is attached to the `encryptButton` (`id="encryptButton"`) to call `processText(true)`.
-   An event listener is attached to the `decryptButton` (`id="decryptButton"`) to call `processText(false)`.
-   The "Close" button (`id="cancelButton"`) has an inline `onclick` attribute that calls `google.script.host.close()` to dismiss the dialog.
-   An event listener is attached to the `copyDecryptedButton` (`id="copyDecryptedButton"`) to copy the content of the `decryptedPasswordOutput` textarea to the user's clipboard using the `navigator.clipboard.writeText()` API.

### Initial Dialog Setup:
-   Upon loading, the script populates the `currentValueDisplay` div and the `cellA1NotationSpan` span with the `initialCellValue` and `cellA1` data passed from `Code.gs`.
-   `secretKeyInput.focus()`: The secret key input field is automatically focused when the dialog opens, improving user experience by allowing immediate typing of the key.

---

## External Dependencies

-   **`Code.gs` (Google Apps Script Server-Side):**
    -   This `Dialog.html` is launched and managed by the `showEncryptDecryptDialog()` function in `Code.gs`.
    -   It receives initial data (current cell value and coordinates) from `Code.gs` via `HtmlService` templating.
    -   For "Encrypt & Update Cell" operations, it communicates back to the `updateCellContent(newValue, row, col)` function in `Code.gs` using `google.script.run` to persist the encrypted data to the spreadsheet.
-   **CryptoJS Library:**
    -   Loaded via a `<script>` tag from `cdnjs.cloudflare.com`.
    -   Provides the `CryptoJS.AES.encrypt` and `CryptoJS.AES.decrypt` methods for performing AES encryption and decryption directly in the browser.
-   **Google Apps Script Client-Side APIs:**
    -   `google.script.run`: Used to execute server-side functions in `Code.gs` asynchronously from the client-side JavaScript.
    -   `google.script.host.close()`: Used to close the modal dialog from within its own JavaScript.
-   **Standard Web Browser APIs:**
    -   DOM (Document Object Model) manipulation methods (e.g., `document.getElementById`, `textContent`, `value`, `disabled`, `style.display`).
    -   Event handling (`addEventListener`).
    -   `navigator.clipboard.writeText()` for copying text to the clipboard.
    -   `setTimeout()` for timed operations (like clearing status messages or deferring CPU-intensive tasks).

---

## Security Notes

-   The primary security of any data encrypted using this tool relies entirely on the **strength, uniqueness, and confidentiality** of the "Secret Key / Passphrase" entered by the user.
-   All cryptographic operations involving the secret key and the sensitive text (plaintext or ciphertext) occur **client-side** within this dialog in the user's browser. The secret key is not transmitted to the Google Apps Script server for the purpose of these cryptographic operations.
-   The "View Decrypted" feature is designed to minimize exposure of plaintext passwords by displaying them only temporarily within the dialog and not writing them back to the spreadsheet, thus keeping the stored version encrypted.

---
