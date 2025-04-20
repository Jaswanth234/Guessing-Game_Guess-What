import { SVGProps, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export interface QRCodeProps extends SVGProps<SVGSVGElement> {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  level?: "L" | "M" | "Q" | "H";
  includeMargin?: boolean;
}

export function QRCode({
  value,
  size = 128,
  bgColor = "#FFFFFF",
  fgColor = "#000000",
  level = "L",
  includeMargin = false,
  ...props
}: QRCodeProps) {
  // Directly use the imported QRCodeSVG component
  return (
    <QRCodeSVG
      value={value}
      size={size}
      bgColor={bgColor}
      fgColor={fgColor}
      level={level}
      includeMargin={includeMargin}
      {...props}
    />
  );
}
