import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const host = forwardedHost ?? url.host;
  const protocol = forwardedProto ?? url.protocol.replace(':', '');
  const joinUrl = `${protocol}://${host}/play/MJ2-DEMO`;

  const svg = await QRCode.toString(joinUrl, {
    type: 'svg',
    width: 320,
    margin: 1,
    errorCorrectionLevel: 'M',
  });

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Join-URL': joinUrl,
    },
  });
}
