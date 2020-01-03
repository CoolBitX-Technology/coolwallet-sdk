import ByteBuffer from 'bytebuffer'
import Long from 'long'

type Transaction = import('./types').Transaction

export const toTransferByteBuffer = (txObject: Transaction) => {
  try {
    let b = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN)
    b.writeUint32(txObject.expiration)
    b.writeUint16(txObject.ref_block_num)
    b.writeUint32(txObject.ref_block_prefix)
    b.writeVarint32(txObject.max_net_usage_words)
    b.writeUint8(txObject.max_cpu_usage_ms)
    b.writeVarint32(0)
    b.writeVarint32(0)
    b.writeVarint32(1)
    b.writeUint64(encodeName('eosio.token', false))
    b.writeUint64(encodeName('transfer', false))
    b.writeVarint32(1) // authorization.length

    b.writeUint64(encodeName(txObject.data.from, false)) //authorization actor
    b.writeUint64(encodeName('active', false))
    // start of hash data
    let b2 = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN)
    b2.writeUint64(encodeName(txObject.data.from, false))
    b2.writeUint64(encodeName(txObject.data.to, false))
    let arr = txObject.data.quantity.split(' ')

    b2.writeInt64(Number(arr[0].replace('.', '')))

    let symbol = arr[1]
    let pad = '\0'.repeat(7 - symbol.length)

    let precision = arr[0].split('.')[1].length

    b2.append(String.fromCharCode(precision) + symbol + pad)

    b2.writeVString(txObject.data.memo)
    b.writeVarint32(b2.offset)
    b.append(b2.copy(0, b2.offset), 'binary')
    b.writeVarint32(0)

    return b.copy(0, b.offset)
  } catch (error) {
    throw 'toTransferByteBuffer: ' + error
  }
}

export const encodeName = (name: string, littleEndian:boolean = true): Long => {
  if (name.length > 12) throw new TypeError('A name can be up to 12 characters long')

  let bitstr = ''
  for (let i = 0; i <= 12; i++) {
    const c = i < name.length ? charidx(name[i]) : 0
    const bitlen = i < 12 ? 5 : 4
    let bits = Number(c).toString(2)
    if (bits.length > bitlen) {
      throw new TypeError('Invalid name ' + name)
    }
    bits = '0'.repeat(bitlen - bits.length) + bits
    bitstr += bits
  }

  const value = Long.fromString(bitstr, true, 2)

  // convert to LITTLE_ENDIAN
  let leHex = ''
  const bytes = littleEndian ? value.toBytesLE() : value.toBytesBE()
  for (const b of bytes) {
    const n = Number(b).toString(16)
    leHex += (n.length === 1 ? '0' : '') + n
  }

  return Long.fromString(leHex, true, 16)
  // .toString()
  // return ulName.toString()
}

const charidx = (ch: string) => {
  const charmap = '.12345abcdefghijklmnopqrstuvwxyz'
  const idx = charmap.indexOf(ch)
  if (idx === -1) throw new TypeError(`Invalid character: '${ch}'`)
  return idx
}
