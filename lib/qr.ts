import QRCode from "qrcode";

export async function passportQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    margin: 1,
    width: 360,
    color: {
      dark: "#07100c",
      light: "#f2f5ed",
    },
  });
}
