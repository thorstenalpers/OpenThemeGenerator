// Renders the app icon into the PNG and ICO files tauri.conf.json points at.
//
// By hand rather than through `tauri icon` so a fresh clone can produce the bundle assets with
// nothing installed but Node — and so the icon is a source file rather than a checked-in binary
// nobody can edit.

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src-tauri', 'icons');

const BACKGROUND = [16, 16, 20];
const LIGHT = [245, 245, 245];
const ACCENT = [99, 102, 241];

/** Supersampling factor. Three passes per axis is enough to hide the stair-steps at 16 px. */
const SAMPLES = 3;

function coverage(size, test) {
	return (x, y) => {
		let hits = 0;
		for (let sy = 0; sy < SAMPLES; sy += 1) {
			for (let sx = 0; sx < SAMPLES; sx += 1) {
				const px = (x + (sx + 0.5) / SAMPLES) / size;
				const py = (y + (sy + 0.5) / SAMPLES) / size;
				if (test(px, py)) hits += 1;
			}
		}
		return hits / (SAMPLES * SAMPLES);
	};
}

function over(base, layer, alpha) {
	return base.map((channel, index) => Math.round(channel * (1 - alpha) + layer[index] * alpha));
}

/** Rounded square, then the two circles the favicon carries. Coordinates are 0–1. */
function render(size) {
	const radius = 0.22;
	const inSquare = coverage(size, (x, y) => {
		const dx = Math.max(radius - x, x - (1 - radius), 0);
		const dy = Math.max(radius - y, y - (1 - radius), 0);
		return dx * dx + dy * dy <= radius * radius;
	});
	const circle = (cx, cy, r) => coverage(size, (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r);
	const inLight = circle(0.375, 0.41, 0.172);
	const inAccent = circle(0.625, 0.59, 0.172);

	const pixels = Buffer.alloc(size * size * 4);
	for (let y = 0; y < size; y += 1) {
		for (let x = 0; x < size; x += 1) {
			const alpha = inSquare(x, y);
			let colour = BACKGROUND;
			colour = over(colour, LIGHT, inLight(x, y));
			colour = over(colour, ACCENT, inAccent(x, y) * 0.92);

			const offset = (y * size + x) * 4;
			pixels[offset] = colour[0];
			pixels[offset + 1] = colour[1];
			pixels[offset + 2] = colour[2];
			pixels[offset + 3] = Math.round(alpha * 255);
		}
	}
	return pixels;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
	let value = index;
	for (let bit = 0; bit < 8; bit += 1) {
		value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
	}
	return value >>> 0;
});

function crc32(buffer) {
	let value = 0xffffffff;
	for (const byte of buffer) value = CRC_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
	return (value ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
	const length = Buffer.alloc(4);
	length.writeUInt32BE(data.length);
	const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(crc32(body));
	return Buffer.concat([length, body, crc]);
}

function png(size) {
	const pixels = render(size);
	const header = Buffer.alloc(13);
	header.writeUInt32BE(size, 0);
	header.writeUInt32BE(size, 4);
	header[8] = 8; // bit depth
	header[9] = 6; // truecolour with alpha

	// One filter byte per scanline. Filter 0 is "none": the data is already small enough that a
	// smarter predictor would only make this script harder to read.
	const raw = Buffer.alloc(size * (size * 4 + 1));
	for (let y = 0; y < size; y += 1) {
		raw[y * (size * 4 + 1)] = 0;
		pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
	}

	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk('IHDR', header),
		chunk('IDAT', deflateSync(raw, { level: 9 })),
		chunk('IEND', Buffer.alloc(0))
	]);
}

/** A Vista-era ICO: the directory entries point at whole PNG files rather than raw DIBs. */
function ico(sizes) {
	const images = sizes.map((size) => ({ size, data: png(size) }));
	const header = Buffer.alloc(6);
	header.writeUInt16LE(0, 0);
	header.writeUInt16LE(1, 2);
	header.writeUInt16LE(images.length, 4);

	let offset = 6 + images.length * 16;
	const entries = images.map(({ size, data }) => {
		const entry = Buffer.alloc(16);
		entry[0] = size >= 256 ? 0 : size;
		entry[1] = size >= 256 ? 0 : size;
		entry.writeUInt16LE(1, 4);
		entry.writeUInt16LE(32, 6);
		entry.writeUInt32LE(data.length, 8);
		entry.writeUInt32LE(offset, 12);
		offset += data.length;
		return entry;
	});

	return Buffer.concat([header, ...entries, ...images.map((image) => image.data)]);
}

mkdirSync(OUT, { recursive: true });
for (const [name, size] of [
	['32x32.png', 32],
	['128x128.png', 128],
	['128x128@2x.png', 256]
]) {
	writeFileSync(join(OUT, name), png(size));
	console.log(`${name} — ${size}px`);
}
writeFileSync(join(OUT, 'icon.ico'), ico([16, 32, 48, 256]));
console.log('icon.ico — 16, 32, 48, 256px');
