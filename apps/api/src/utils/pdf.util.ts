import PDFDocument from 'pdfkit';
import { CryptoUtil } from './crypto.util.js';

export class PdfUtil {
  /**
   * Generates a Bezon Billbook styled invoice for an order.
   * Resolves with a Buffer containing the PDF data.
   */
  static async generateOrderInvoice(order: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });
        doc.on('error', reject);

        // Styling constants
        const primaryColor = '#4f46e5'; // teal-600
        const textColor = '#334155'; // zinc-700
        const lightColor = '#94a3b8'; // zinc-400

        // Header Section
        doc
          .fillColor(primaryColor)
          .fontSize(28)
          .font('Helvetica-Bold')
          .text('BEZON', 50, 50, { align: 'left' });

        doc
          .fillColor(textColor)
          .fontSize(10)
          .font('Helvetica')
          .text('The Everything Store', 50, 80);

        // Invoice Meta
        doc
          .fillColor(textColor)
          .fontSize(20)
          .font('Helvetica-Bold')
          .text('INVOICE', 0, 50, { align: 'right' });

        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor(lightColor)
          .text(`Order ID: `, 400, 80, { continued: true })
          .fillColor(textColor)
          .font('Helvetica-Bold')
          .text(order.orderNumber, { align: 'right' });

        doc
          .font('Helvetica')
          .fillColor(lightColor)
          .text(`Date: `, 400, 95, { continued: true })
          .fillColor(textColor)
          .text(new Date(order.createdAt).toLocaleDateString(), {
            align: 'right',
          });

        // Divider
        doc
          .strokeColor('#e2e8f0')
          .lineWidth(1)
          .moveTo(50, 120)
          .lineTo(550, 120)
          .stroke();

        // Addresses Section
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor(primaryColor)
          .text('Seller Details', 50, 140);

        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor(textColor)
          .text(order.seller?.shopName || 'Bezon Seller', 50, 155);

        let currentY = 170;
        doc.font('Helvetica').fontSize(9).fillColor(textColor);
        if (order.seller?.gstin) {
          doc.text(`GSTIN: ${order.seller.gstin}`, 50, currentY);
          currentY += 12;
        }
        if (order.seller?.panNumber) {
          doc.text(`PAN: ${order.seller.panNumber}`, 50, currentY);
          currentY += 12;
        }

        if (order.seller?.bankNameEnc || order.seller?.bankAccountEnc) {
          currentY += 5;
          doc.font('Helvetica-Bold').text('Bank Details', 50, currentY);
          currentY += 12;
          doc.font('Helvetica');
          if (order.seller.bankNameEnc) {
            doc.text(
              CryptoUtil.decrypt(order.seller.bankNameEnc),
              50,
              currentY,
            );
            currentY += 12;
          }
          if (order.seller.bankAccountEnc) {
            doc.text(
              `A/C: ${CryptoUtil.decrypt(order.seller.bankAccountEnc)}`,
              50,
              currentY,
            );
            currentY += 12;
          }
          if (order.seller.ifscEnc) {
            doc.text(
              `IFSC: ${CryptoUtil.decrypt(order.seller.ifscEnc)}`,
              50,
              currentY,
            );
          }
        }

        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor(primaryColor)
          .text('Billed To', 300, 140);

        const customerName =
          order.customer?.name ||
          (order.addressSnapshot as any)?.fullName ||
          'Guest';
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor(textColor)
          .text(customerName, 300, 155);

        if (order.addressSnapshot) {
          doc
            .font('Helvetica')
            .text((order.addressSnapshot as any).street || '', 300, 170)
            .text(
              `${(order.addressSnapshot as any).city || ''}, ${(order.addressSnapshot as any).state || ''} ${(order.addressSnapshot as any).pincode || ''}`,
              300,
              185,
            )
            .text(
              `Phone: ${(order.addressSnapshot as any).phone || order.customer?.phone || ''}`,
              300,
              200,
            );
        }

        // Table Header
        let tableTop = 250;
        doc.rect(50, tableTop, 500, 25).fill('#f8fafc'); // zinc-50

        doc
          .fillColor('#64748b') // zinc-500
          .font('Helvetica-Bold')
          .fontSize(10)
          .text('Item', 60, tableTop + 7)
          .text('Unit Price', 280, tableTop + 7, { width: 90, align: 'right' })
          .text('Qty', 380, tableTop + 7, { width: 50, align: 'right' })
          .text('Amount', 440, tableTop + 7, { width: 90, align: 'right' });

        // Table Content
        let y = tableTop + 35;
        doc.font('Helvetica').fillColor(textColor);

        for (const item of order.items) {
          const itemTitle = item.product?.title || item.productId;
          const unitPrice = Number(item.unitPrice);
          const amount = unitPrice * item.qty;

          // Draw item row
          doc.text(itemTitle, 60, y, { width: 220, height: 15 });
          doc.text(`Rs. ${unitPrice.toFixed(2)}`, 280, y, {
            width: 90,
            align: 'right',
          });
          doc.text(item.qty.toString(), 380, y, { width: 50, align: 'right' });
          doc.text(`Rs. ${amount.toFixed(2)}`, 440, y, {
            width: 90,
            align: 'right',
          });

          y += 20;

          // Page break handling
          if (y > 700) {
            doc.addPage();
            y = 50;
          }
        }

        // Divider
        y += 10;
        doc
          .strokeColor('#e2e8f0')
          .lineWidth(1)
          .moveTo(50, y)
          .lineTo(550, y)
          .stroke();

        y += 15;

        // Totals Section
        const subtotal = Number(order.subtotal || 0);
        const discount = Number(order.discount || 0);
        const shipping = Number(order.shippingCharge || 0);
        const total = Number(order.total || 0);

        doc.font('Helvetica');
        doc.text('Subtotal:', 380, y, { width: 70, align: 'right' });
        doc.text(`Rs. ${subtotal.toFixed(2)}`, 450, y, {
          width: 80,
          align: 'right',
        });

        if (discount > 0) {
          y += 20;
          doc.text(`Discount (${order.couponCode || 'Coupon'}):`, 300, y, {
            width: 150,
            align: 'right',
          });
          doc.text(`-Rs. ${discount.toFixed(2)}`, 450, y, {
            width: 80,
            align: 'right',
          });
        }

        y += 20;
        doc.text('Fulfillment Charges:', 350, y, {
          width: 100,
          align: 'right',
        });
        doc.text(
          shipping === 0 ? 'FREE' : `Rs. ${shipping.toFixed(2)}`,
          450,
          y,
          { width: 80, align: 'right' },
        );

        y += 20;
        doc.strokeColor('#cbd5e1').moveTo(350, y).lineTo(550, y).stroke();

        y += 10;
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text('Grand Total:', 350, y, { width: 100, align: 'right' });
        doc.fillColor(primaryColor).text(`Rs. ${total.toFixed(2)}`, 450, y, {
          width: 80,
          align: 'right',
        });

        // Footer
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor(lightColor)
          .text('Thank you for shopping with Bezon!', 50, 750, {
            align: 'center',
            width: 500,
          });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
