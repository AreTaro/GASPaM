# Code.gs - Google Sheet Password Encryption/Decryption Server Logic

This Google Apps Script file (`Code.gs`) contains the server-side logic that enables users to encrypt and decrypt text (primarily intended for passwords) directly within a Google Spreadsheet. It facilitates this by adding a custom menu to the Sheet's UI, which then launches an HTML dialog where the user interacts with the cryptographic functions. This script is responsible for managing the display of this dialog and updating the spreadsheet cell with encrypted data.

---

## Configuration

### `PASSWORD_COLUMN_NUMBER`

-   **Type:** `Constant` (Number)
-   **Description:** This global constant defines the 1-indexed column number in your spreadsheet where passwords (or their encrypted versions) are stored and will be processed by this tool. Users **must** modify this value to match the column they intend to use for password storage in their specific sheet layout. For instance, if passwords are in Column C, this should be set to `3`.
-   **Default Value:** `3`
    ```javascript
    const PASSWORD_COLUMN_NUMBER = 3; // <--- CHANGE THIS to your password column number (e.g., 3 for Column C)
    ```
-   **Usage:** This constant is used by the `showEncryptDecryptDialog()` function to verify that the user has selected a cell within the designated password column before proceeding with an encryption or decryption operation.

---

## Functions

### `onOpen(e)`

**NAME**
`onOpen` - Adds a custom "Password Manager" menu to the Google Sheet interface.

**SYNOPSIS**
```javascript
function onOpen(e)
```

**DESCRIPTION**
This function is a simple trigger that runs automatically each time the Google Spreadsheet is opened by a user. Its purpose is to create a custom menu in the spreadsheet's main menu bar. The menu is labeled "Password Manager" and contains a single item: "Encrypt/Decrypt Selected". Selecting this menu item will execute the `showEncryptDecryptDialog()` function.

**PARAMETERS**
-   `e` (Object): The event object automatically passed by Google Apps Script when an `onOpen` trigger fires. It can contain contextual information about the event (e.g., auth mode, user). This parameter is not directly utilized in the current implementation of the function.

**RETURN VALUE**
-   None.

**SIDE EFFECTS**
-   Modifies the Google Sheets user interface by adding a new top-level menu named "Password Manager".

**NOTES**
-   The user opening the spreadsheet needs at least view permission for the menu to appear. For the menu item to successfully launch the dialog and subsequently modify the sheet (on encryption), the user will generally need edit permissions for the spreadsheet.

---

### `showEncryptDecryptDialog()`

**NAME**
`showEncryptDecryptDialog` - Validates the user's current cell selection and displays an HTML dialog for password processing.

**SYNOPSIS**
```javascript
function showEncryptDecryptDialog()
```

**DESCRIPTION**
This function is invoked when a user clicks the "Encrypt/Decrypt Selected" item from the "Password Manager" custom menu. It orchestrates the process of launching an interactive dialog for encryption/decryption. Its key responsibilities are:
1.  **Get Active Context:** Retrieves the active spreadsheet, sheet, and the currently selected cell range.
2.  **Selection Validation:**
    * It verifies that the user has selected only a *single cell*. If multiple cells or a range covering multiple cells is selected, an alert is shown, and the function exits.
    * It checks if the column of the selected cell matches the `PASSWORD_COLUMN_NUMBER` defined in the configuration. If the selection is outside the designated password column, an alert with the expected column letter is displayed, and the function exits.
3.  **Data Retrieval:** If the selection is valid, it extracts the current string value from the selected cell, along with its row number, column number, and A1 notation (e.g., "C2").
4.  **HTML Dialog Preparation:**
    * It creates an HTML template object from a file named `Dialog.html` (which must exist in the same Apps Script project).
    * It passes the retrieved `currentValue`, `cellRow`, `cellCol`, and `cellA1` as data properties to this HTML template. This data will be accessible to the client-side JavaScript within the `Dialog.html`.
5.  **Dialog Display:** The populated HTML template is evaluated and then displayed to the user as a modal dialog box, titled "Encrypt / Decrypt Password". This dialog will contain the necessary UI elements for the user to enter their secret key and trigger cryptographic operations.

**PARAMETERS**
-   None. It operates on the active selection within the spreadsheet.

**RETURN VALUE**
-   None.

**SIDE EFFECTS**
-   Displays a modal dialog to the user if all validation checks pass.
-   Displays an alert message via `SpreadsheetApp.getUi().alert()` if selection validation fails.

**DEPENDENCIES**
-   Requires an HTML file named `Dialog.html` to be present in the Apps Script project.
-   Utilizes the `SpreadsheetApp` service for UI interaction (alerts, getting active elements) and the `HtmlService` for creating and displaying the dialog.

---

### `updateCellContent(newValue, row, col)`

**NAME**
`updateCellContent` - Updates a specified cell in the Google Sheet with a new value.

**SYNOPSIS**
```javascript
function updateCellContent(newValue, row, col)
```

**DESCRIPTION**
This function is designed to be called exclusively from the client-side JavaScript running within the `Dialog.html` (via `google.script.run`). Its role is to write a new value, typically an encrypted password string, back into the spreadsheet cell from which the original content was taken for an *encryption* operation. It does not get called for view-only decryption operations from the dialog.

**PARAMETERS**
-   `newValue` (String): The new string value (e.g., the ciphertext) that should be written into the target cell.
-   `row` (Number): The 1-indexed row number of the cell to be updated.
-   `col` (Number): The 1-indexed column number of the cell to be updated.

**RETURN VALUE**
-   `Object`: An object sent back to the client-side caller, indicating the success or failure of the cell update operation.
    * On success: `{ success: true, message: "Cell [A1Notation] updated." }`
    * On failure: `{ success: false, message: "Error updating sheet: [errorMessage]" }`

**SIDE EFFECTS**
-   Modifies the content of a specific cell within the active Google Sheet if the operation is successful.
-   Logs the outcome (success or error, including the cell's A1 notation and the new value on success) to the Google Apps Script execution logs via `Logger.log()`.

**NOTES**
-   This function is a critical part of the data flow for persisting encrypted data back to the spreadsheet.
-   It includes basic error handling for the `setValue` operation on the cell.

---
```
