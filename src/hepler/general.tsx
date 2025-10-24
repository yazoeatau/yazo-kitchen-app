import printerService from "../services/printerService";
import { storageService } from "../utils/storage";

export const handleTestPrint = async (order) => {
  try {
    const {
      customerName = "Walk-in Customer",
      orderNumber = "",
      orderType = "dine-in",
      total = 0,
      items = [],
      paymentMethod = "Cash",
      status = "",
    } = order;

    const LINE_WIDTH = 48;
    const ESC = "\x1B";
    const BOLD_ON = `${ESC}E\x01`;
    const BOLD_OFF = `${ESC}E\x00`;

    const alignLine = (left, right) => {
      const stripEsc = str => str.replace(/\x1B\[[0-9;]*[A-Za-z]/g, '');
      const spaceCount = Math.max(LINE_WIDTH - stripEsc(left).length - stripEsc(right).length, 0);
      return left + " ".repeat(spaceCount) + right;
    };

    let docketText = "";
    docketText += "\n========= YAZO =========\n";
    docketText += alignLine("Customer:", customerName) + "\n";
    docketText += alignLine("Order No:", orderNumber) + "\n";
    docketText += alignLine("Type:", orderType) + "\n";
    docketText += alignLine("Payment:", paymentMethod) + "\n";
    docketText += alignLine("Status:", status) + "\n";
    docketText += "-----------------------------------------------\n";


    items.forEach((item, i) => {
      const addonsPrice = item.selectedOptions?.reduce((sum, opt) => sum + (opt.price || 0), 0) || 0;
      const variant = item.selectedVariant?.name || "";
      const price = (item.selectedVariant?.price || item.price || 0) + addonsPrice;
      const options = item.selectedOptions?.map((opt) => opt.name).join(", ") || "";

      docketText += alignLine(
        `${i + 1}. ${item.name}${variant ? ` (${variant})` : ""}`,
        `$${price.toFixed(2)}`
      ) + "\n";
      if (options) {
        docketText += alignLine(`   ${options}`, "") + "\n\n";
      }

      docketText += alignLine(
        `Qty: `,
        `x${((item.quantity || 1))}`
      ) + "\n";

      docketText += "-----------------------------------------------\n";
    });
    docketText += alignLine("Total:", `$${total.toFixed(2)}`);
    
    const result = await printerService.printESCPOS(docketText);
    console.log("🖨️ Print result:", result);
    return result;
  } catch (error) {
    console.error("Print failed:", error);
  }
};
