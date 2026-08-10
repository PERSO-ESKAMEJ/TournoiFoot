'use client';

import { useRef } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function RegistrationQrCode({ url }: { url: string }) {
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const svgWrapRef = useRef<HTMLDivElement>(null);

  function downloadPng() {
    const canvas = canvasWrapRef.current?.querySelector('canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'inscription-qr.png';
    a.click();
  }

  function downloadSvg() {
    const svg = svgWrapRef.current?.querySelector('svg');
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inscription-qr.svg';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">QR code d&apos;inscription</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-start gap-6">
          <div ref={canvasWrapRef} className="rounded-lg border bg-white p-3">
            <QRCodeCanvas value={url} size={180} />
          </div>
          <div ref={svgWrapRef} className="hidden">
            <QRCodeSVG value={url} size={180} />
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={downloadPng}>
              Télécharger PNG
            </Button>
            <Button variant="outline" size="sm" onClick={downloadSvg}>
              Télécharger SVG
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Input readOnly value={url} className="font-mono text-xs" />
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(url);
              toast.success('Lien copié');
            }}
          >
            Copier
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Ce QR pointe vers la page publique d&apos;inscription — à intégrer dans le flyer d&apos;appel à
          candidatures.
        </p>
      </CardContent>
    </Card>
  );
}
