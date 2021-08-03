// Number.MAX_SAFE_INTEGER
const MAX_SAFE_INTEGER = 9007199254740991;

function checkUInt53(n: number) {
	if (n < 0 || n > MAX_SAFE_INTEGER || n % 1 !== 0) throw new RangeError('value out of range');
}

export function encode(n: number, buf?: Buffer, off?: number): Buffer {
	const num = n;
	let buffer = buf;
	let offset = off;
	checkUInt53(num);

	if (!buffer) buffer = Buffer.allocUnsafe(encodingLength(num));
	if (!Buffer.isBuffer(buffer)) throw new TypeError('buffer must be a Buffer instance');
	if (!offset) offset = 0;

	// 8 bit
	if (num < 0xfd) {
		buffer.writeUInt8(num, offset);
		// encode.bytes = 1;

	// 16 bit
	} else if (num <= 0xffff) {
		buffer.writeUInt8(0xfd, offset);
		buffer.writeUInt16LE(num, offset + 1);
		// encode.bytes = 3;

	// 32 bit
	} else if (num <= 0xffffffff) {
		buffer.writeUInt8(0xfe, offset);
		buffer.writeUInt32LE(num, offset + 1);
		// encode.bytes = 5;

	// 64 bit
	} else {
		buffer.writeUInt8(0xff, offset);
		// eslint-disable-next-line no-bitwise
		buffer.writeUInt32LE(num >>> 0, offset + 1);
		// eslint-disable-next-line no-bitwise
		buffer.writeUInt32LE((num / 0x100000000) | 0, offset + 5);
		// encode.bytes = 9;
	}

	return buffer;
}

export function decode(buf: Buffer, off?: number): number {
	const buffer = buf;
	let offset = off;
	if (!Buffer.isBuffer(buffer)) throw new TypeError('buffer must be a Buffer instance');
	if (!offset) offset = 0;

	const first = buffer.readUInt8(offset);

	// 8 bit
	if (first < 0xfd) {
		// decode.bytes = 1;
		return first;

	// 16 bit
	// eslint-disable-next-line no-else-return
	} else if (first === 0xfd) {
		// decode.bytes = 3;
		return buffer.readUInt16LE(offset + 1);

	// 32 bit
	} else if (first === 0xfe) {
		// decode.bytes = 5;
		return buffer.readUInt32LE(offset + 1);

	// 64 bit
	} else {
		// decode.bytes = 9;
		const lo = buffer.readUInt32LE(offset + 1);
		const hi = buffer.readUInt32LE(offset + 5);
		const num = hi * 0x0100000000 + lo;
		checkUInt53(num);

		return num;
	}
}

export function encodingLength(n: number): number {
	const num = n;
	checkUInt53(num);

	return (
		// eslint-disable-next-line no-nested-ternary
		num < 0xfd ? 1 : num <= 0xffff ? 3 : num <= 0xffffffff ? 5 : 9
	);
}
