// --- Configuration ---
// Set the column number where your passwords are stored.
// IMPORTANT: This is 1-indexed (A=1, B=2, C=3, etc.)
const PASSWORD_COLUMN_NUMBER = 3; // <--- CHANGE THIS to your password column number (e.g., 3 for Column C)
// --- End Configuration ---

/**
 * Adds a custom menu to the spreadsheet when it's opened.
 */
function onOpen(e) {
  SpreadsheetApp.getUi()
      .createMenu('Password Manager')
      .addItem('Encrypt/Decrypt Selected', 'showEncryptDecryptDialog')
      .addToUi();
}

/**
 * Shows the HTML dialog to get the secret key and process the selected cell.
 */
function showEncryptDecryptDialog() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = sheet.getActiveRange();
  
  // Validate selection
  if (range.getNumRows() > 1 || range.getNumColumns() > 1) {
    ui.alert('Selection Error', 'Please select only a single cell containing a password or encrypted text.', ui.ButtonSet.OK);
    return;
  }
  
  const cell = range.getCell(1, 1);
  if (cell.getColumn() !== PASSWORD_COLUMN_NUMBER) {
    // Determine the correct column letter for the message
    let columnLetter = '';
    try {
        columnLetter = sheet.getRange(1, PASSWORD_COLUMN_NUMBER).getA1Notation().replace(/[0-9]/g, '');
    } catch (e) {
        columnLetter = `Column ${PASSWORD_COLUMN_NUMBER}`; // Fallback if getRange fails (e.g. invalid number)
    }
    ui.alert('Selection Error', `Please select a cell in the designated password column (${columnLetter}).`, ui.ButtonSet.OK);
    return;
  }

  const currentValue = cell.getValue().toString();
  const cellRow = cell.getRow();
  const cellCol = cell.getColumn();
  const cellA1 = cell.getA1Notation();

  // Create an HTML template from the Dialog.html file
  const htmlTemplate = HtmlService.createTemplateFromFile('Dialog');
  
  // Pass data to the HTML template
  htmlTemplate.currentValue = currentValue;
  htmlTemplate.cellRow = cellRow;
  htmlTemplate.cellCol = cellCol;
  htmlTemplate.cellA1 = cellA1;

  // Build and show the dialog
  const htmlOutput = htmlTemplate.evaluate()
      .setWidth(420)
      .setHeight(390); // Adjusted height slightly for potential status messages
  ui.showModalDialog(htmlOutput, 'Encrypt / Decrypt Password');
}

/**
 * Server-side function called by the HTML dialog to update the sheet.
 * @param {string} newValue The new encrypted or decrypted value.
 * @param {number} row The row number of the cell.
 * @param {number} col The column number of the cell.
 * @return {object} An object indicating success or failure.
 */
function updateCellContent(newValue, row, col) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const cell = sheet.getRange(row, col);
    cell.setValue(newValue);
    Logger.log(`Cell ${cell.getA1Notation()} updated successfully with value: ${newValue}`);
    return { success: true, message: `Cell ${cell.getA1Notation()} updated.` };
  } catch (e) {
    Logger.log(`Error updating cell R${row}C${col}: ${e.toString()}`);
    return { success: false, message: `Error updating sheet: ${e.message}` };
  }
}
