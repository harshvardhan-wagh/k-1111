/**
 * Paste this into your Google Sheet:  Extensions → Apps Script
 * Then: Deploy → New deployment → Web app
 *       Execute as: Me   |   Who has access: Anyone
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Logs") || ss.insertSheet("Logs");

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Time (IST)", "Event", "Page", "Details", "Visit ID", "Device"]);
      sheet.setFrozenRows(1);
    }

    const d = JSON.parse(e.postData.contents);
    sheet.appendRow([
      Utilities.formatDate(new Date(), "Asia/Kolkata", "dd-MM-yyyy HH:mm:ss"),
      d.event || "",
      d.page || "",
      d.details || "",
      d.session || "",
      d.device || ""
    ]);
    return ContentService.createTextOutput("ok");
  } finally {
    lock.releaseLock();
  }
}
