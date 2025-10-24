# TethraDEX Farcaster Frame

Dokumentasi untuk implementasi Farcaster Frame di TethraDEX.

## Overview

Farcaster Frame untuk TethraDEX memungkinkan pengguna untuk berinteraksi dengan platform trading langsung dari feed Farcaster mereka. Frame ini menyediakan 4 button utama dengan fungsi berbeda.

## Struktur File

```
src/app/
├── api/
│   └── frame/
│       ├── route.jsx          # Main frame handler (GET & POST)
│       └── image/
│           └── route.jsx      # Image generator untuk frame
└── layout.tsx                 # Updated dengan Farcaster meta tags
```

## Fitur

### 4 Button Utama:

1. **📊 Chart** - Menampilkan informasi tentang advanced trading charts
2. **🔗 Connect** - Informasi tentang wallet connection dengan Privy
3. **💰 Claim USDC** - Informasi tentang faucet USDC gratis (100 USDC)
4. **🪙 Coins** - Menampilkan daftar market yang tersedia (BTC/USD, ETH/USD)

## Endpoints

### Main Frame Endpoint
```
GET/POST https://tethradex.vercel.app/api/frame
```

Query parameters:
- `action`: chart | connect | claim | coins
- `state`: initial | chart | connect | claim | coins
- `coin`: BTC | ETH (optional)

### Image Generator Endpoint
```
GET https://tethradex.vercel.app/api/frame/image
```

Query parameters:
- `view`: main | chart | connect | claim | coins

## Flow Interaksi

### 1. Initial View (Main)
- Menampilkan overview TethraDEX
- 4 button: Chart, Connect, Claim USDC, Coins
- Image: Logo TethraDEX dengan highlights fitur utama

### 2. Chart View
- Informasi tentang advanced charting tools
- Buttons: Back, View Trade (link ke /trade)
- Image: Visualisasi chart features

### 3. Connect View
- Informasi tentang wallet connection
- Buttons: Back, Open App (link ke /trade)
- Image: Wallet connection features (Privy integration)

### 4. Claim View
- Informasi tentang USDC faucet
- Buttons: Back, Claim Now (link ke /trade)
- Image: 100 USDC claim highlight

### 5. Coins View
- Daftar market yang tersedia
- Buttons: Back, BTC/USD, ETH/USD
- Image: Available trading pairs

## Cara Testing

### 1. Menggunakan Farcaster Frame Validator

Kunjungi: https://warpcast.com/~/developers/frames

Masukkan URL:
```
https://tethradex.vercel.app/api/frame
```

### 2. Testing Lokal

```bash
# Development mode
npm run dev

# Access frame
http://localhost:3000/api/frame

# View images
http://localhost:3000/api/frame/image?view=main
http://localhost:3000/api/frame/image?view=chart
http://localhost:3000/api/frame/image?view=connect
http://localhost:3000/api/frame/image?view=claim
http://localhost:3000/api/frame/image?view=coins
```

### 3. Deploy ke Production

```bash
# Build
npm run build

# Deploy ke Vercel
vercel --prod
```

Setelah deploy, test URL production:
```
https://tethradex.vercel.app/api/frame
```

## Meta Tags

Frame menggunakan Farcaster Frame meta tags yang sudah ditambahkan di `layout.tsx`:

```typescript
other: {
  'fc:frame': 'vNext',
  'fc:frame:image': 'https://tethradex.vercel.app/api/frame/image?view=main',
  'fc:frame:image:aspect_ratio': '1.91:1',
  'fc:frame:post_url': 'https://tethradex.vercel.app/api/frame',
  'fc:frame:button:1': '📊 Chart',
  'fc:frame:button:2': '🔗 Connect',
  'fc:frame:button:3': '💰 Claim USDC',
  'fc:frame:button:4': '🪙 Coins',
}
```

## Customization

### Menambah View Baru

Edit [route.jsx](src/app/api/frame/route.jsx):

```javascript
case 'new_view':
  imageUrl = `${APP_URL}/api/frame/image?view=new_view`;
  buttons = [
    { label: 'Button 1', action: 'post', target: `${postUrl}?action=action1` },
    { label: 'Button 2', action: 'link', target: `${APP_URL}/target` },
  ];
  break;
```

Edit [image/route.jsx](src/app/api/frame/image/route.jsx):

```javascript
case 'new_view':
  content = `
    <div style="...">
      Your custom image content
    </div>
  `;
  break;
```

### Mengubah Design Image

Semua design menggunakan inline styles dalam JSX. Edit bagian `content` di setiap case di `image/route.jsx`.

Image specifications:
- Width: 1200px
- Height: 630px
- Aspect ratio: 1.91:1
- Format: Generated via Next.js ImageResponse

## Button Actions

Farcaster Frame mendukung 3 tipe action:

1. **post** - POST request ke frame endpoint
   ```javascript
   { label: 'Button', action: 'post', target: 'URL' }
   ```

2. **link** - Redirect ke URL external
   ```javascript
   { label: 'Button', action: 'link', target: 'URL' }
   ```

3. **post_redirect** - POST kemudian redirect
   ```javascript
   { label: 'Button', action: 'post_redirect', target: 'URL' }
   ```

## Environment Variables

Tambahkan di `.env.local`:

```bash
NEXT_PUBLIC_APP_URL=https://tethradex.vercel.app
```

Atau untuk local testing:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Troubleshooting

### Frame tidak muncul di Farcaster
- Pastikan semua meta tags sudah benar
- Validate menggunakan Frame Validator
- Check image URL bisa diakses public
- Verify POST endpoint berfungsi dengan baik

### Image tidak loading
- Check network tab untuk error
- Verify image endpoint returns 200
- Check image dimensions (1200x630)
- Ensure content-type is correct

### Button tidak berfungsi
- Verify POST endpoint handling
- Check button action types (post/link)
- Ensure target URLs are accessible
- Test dengan Frame Validator

## Resources

- [Farcaster Frames Documentation](https://docs.farcaster.xyz/reference/frames/spec)
- [Next.js ImageResponse](https://nextjs.org/docs/app/api-reference/functions/image-response)
- [Warpcast Frame Validator](https://warpcast.com/~/developers/frames)

## Catatan Penting

1. **Backend belum jalan di VPS** - Saat ini frame hanya menampilkan informasi dan redirect ke app. Fungsi interaktif seperti claim USDC butuh backend yang aktif.

2. **Image Generation** - Menggunakan Next.js ImageResponse dengan edge runtime untuk performa optimal.

3. **Maksimal 4 Buttons** - Farcaster Frame specification membatasi maksimal 4 buttons per frame.

4. **Aspect Ratio** - Image harus 1.91:1 (1200x630px) untuk tampil dengan baik di feed.

## Next Steps

- [ ] Integrasikan dengan backend API untuk real-time data
- [ ] Tambah state management untuk tracking user interaction
- [ ] Implement real price data di frame image
- [ ] Add analytics tracking untuk frame interactions
- [ ] Create dedicated landing page untuk frame users

## Support

Jika ada pertanyaan atau issue, silakan buat issue di repository GitHub atau hubungi tim development.
