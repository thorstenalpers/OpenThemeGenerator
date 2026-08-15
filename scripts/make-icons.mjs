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
const LIGHT = [245, 246, 250];
const ACCENT = [99, 102, 241];
const ACCENT_FAR = [168, 85, 247];
const BEAK_COLOUR = [245, 158, 11];
const INK = [18, 18, 24];

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

/* Shape tests, all in 0–1 across the tile. */

const ellipse =
	(cx, cy, rx, ry, deg = 0) =>
	(x, y) => {
		const a = (deg * Math.PI) / 180;
		const dx = (x - cx) * Math.cos(a) + (y - cy) * Math.sin(a);
		const dy = -(x - cx) * Math.sin(a) + (y - cy) * Math.cos(a);
		return (dx / rx) ** 2 + (dy / ry) ** 2 <= 1;
	};

/**
 * The outline of a silhouette, not of the shapes it is made of.
 *
 * Outlining the body ellipse and the head ellipse separately draws both of them in full, including
 * the halves buried inside the other — two arcs crossing where the neck should be, which reads as a
 * scribble. Eroding the union first leaves only the edge you can actually see.
 */
const edge = (shape, eroded) => (x, y) => shape(x, y) && !eroded(x, y);

const triangle = (ax, ay, bx, by, cx, cy) => {
	const side = (px, py, x1, y1, x2, y2) => (x2 - x1) * (py - y1) - (y2 - y1) * (px - x1);
	return (x, y) => {
		const d = [side(x, y, ax, ay, bx, by), side(x, y, bx, by, cx, cy), side(x, y, cx, cy, ax, ay)];
		return !(d.some((v) => v < 0) && d.some((v) => v > 0));
	};
};

const left = (test) => (x, y) => x < 0.5 && test(x, y);
const right = (test) => (x, y) => x >= 0.5 && test(x, y);

const BODY = (x, y) =>
	ellipse(0.5, 0.605, 0.245, 0.275)(x, y) || ellipse(0.5, 0.335, 0.178, 0.178)(x, y);
const BELLY = ellipse(0.5, 0.645, 0.163, 0.212);
const FACE = ellipse(0.5, 0.35, 0.128, 0.118);
const BEAK = triangle(0.458, 0.372, 0.542, 0.372, 0.5, 0.425);
const FOOT_R = ellipse(0.602, 0.878, 0.078, 0.034, 8);
const FOOT_L = ellipse(0.398, 0.878, 0.078, 0.034, -8);
const FLIPPER_L = ellipse(0.253, 0.63, 0.052, 0.15, -18);
const FLIPPER_R = ellipse(0.747, 0.63, 0.052, 0.15, 18);

/**
 * The mark: one penguin, unpainted on the left and themed on the right.
 *
 * It is the whole app in two shapes — the same thing before and after a theme reaches it — and it
 * survives the icon's real problem, which is 16 px. Everything here is drawn per size rather than
 * scaled down from one master, so the strokes and the eye can be widened where a hairline would
 * fall below a pixel and disappear.
 */
function render(size) {
	const radius = 0.22;
	const inSquare = coverage(size, (x, y) => {
		const dx = Math.max(radius - x, x - (1 - radius), 0);
		const dy = Math.max(radius - y, y - (1 - radius), 0);
		return dx * dx + dy * dy <= radius * radius;
	});

	// A 0.026 stroke is a quarter of a pixel at 16 px. Below that the outline half is simply not
	// there, so it is widened until it is at least one pixel across.
	const stroke = Math.max(0.026, 1.15 / size);
	// Grown so it survives a pixel grid, but capped: past about a twentieth of the tile the eye is
	// bigger than the head it sits in, and the pair of them close into a dark band.
	const pupil = Math.min(0.046, Math.max(0.026, 1.1 / size));

	/**
	 * Under 40 px the left half is filled rather than outlined.
	 *
	 * A hairline and a fill cannot share an icon that small — the stroke needed to survive is so
	 * heavy it closes the shape it is supposed to describe. Two solid halves say the same thing and
	 * stay a penguin, which is what the taskbar and the tab strip actually get.
	 */
	const outlined = size >= 40;

	const painted = [
		[right(BODY), (x) => over(ACCENT, ACCENT_FAR, Math.min(1, Math.max(0, (x - 0.5) * 2.6)))],
		[right(FLIPPER_R), ACCENT_FAR],
		[right(FOOT_R), BEAK_COLOUR],
		[right(BELLY), LIGHT],
		[right(FACE), LIGHT],
		[right(BEAK), BEAK_COLOUR],
		[right(ellipse(0.548, 0.315, pupil, pupil)), INK]
	];

	const eroded = (w) => (x, y) =>
		ellipse(0.5, 0.605, 0.245 - w, 0.275 - w)(x, y) ||
		ellipse(0.5, 0.335, 0.178 - w, 0.178 - w)(x, y);

	const bare = outlined
		? [
				[left(edge(BODY, eroded(stroke))), LIGHT],
				[left(edge(BELLY, ellipse(0.5, 0.645, 0.163 - stroke * 0.8, 0.212 - stroke * 0.8))), LIGHT],
				// Filled rather than outlined: a flipper and a foot are thinner than the stroke that
				// would have to describe them, so outlining either one closes it into a blob.
				[left(FLIPPER_L), LIGHT],
				[left(FOOT_L), LIGHT],
				[left(ellipse(0.452, 0.315, pupil, pupil)), LIGHT]
			]
		: [
				// Unpainted, so a neutral grey rather than the belly's white — against white the split
				// disappears into the belly and the mark becomes one pale blob with a coloured edge.
				[left(BODY), [130, 134, 150]],
				[left(FLIPPER_L), [112, 116, 132]],
				[left(FOOT_L), [112, 116, 132]],
				[left(BELLY), [222, 224, 233]],
				[left(FACE), [222, 224, 233]],
				...(size >= 24 ? [[left(ellipse(0.452, 0.315, pupil, pupil)), INK]] : [])
			];

	const layers = [...painted, ...bare].map(([test, colour]) => [coverage(size, test), colour]);

	const pixels = Buffer.alloc(size * size * 4);
	for (let y = 0; y < size; y += 1) {
		for (let x = 0; x < size; x += 1) {
			let colour = BACKGROUND;
			for (const [cover, paint] of layers) {
				const alpha = cover(x, y);
				if (alpha <= 0) continue;
				colour = over(
					colour,
					typeof paint === 'function' ? paint((x + 0.5) / size, (y + 0.5) / size) : paint,
					alpha
				);
			}

			const offset = (y * size + x) * 4;
			pixels[offset] = colour[0];
			pixels[offset + 1] = colour[1];
			pixels[offset + 2] = colour[2];
			pixels[offset + 3] = Math.round(inSquare(x, y) * 255);
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
