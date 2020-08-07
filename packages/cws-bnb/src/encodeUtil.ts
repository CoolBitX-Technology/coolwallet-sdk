import is from 'is_js';
import { string as VarString } from "protocol-buffers-encodings"
import typeToTyp3 from "./encoderHelper";
import * as UVarInt from './varuint';


export const encodeNumber = (num: number) => UVarInt.encode(num)

export const encodeBool = (b: boolean) =>
  b ? UVarInt.encode(1) : UVarInt.encode(0)

export const encodeString = (str: string) => {
  const buf = Buffer.alloc(VarString.encodingLength(str))
  return VarString.encode(str, buf, 0)
}

export const marshalBinary = (obj: any) => {
  if (!is.object(obj)) throw new TypeError("data must be an object")
  return encodeBinary(obj, -1, true).toString("hex")
}

export const encodeBinary = (
  val: any,
  fieldNum?: number,
  isByteLenPrefix?: boolean
) => {
  if (val === null || val === undefined) throw new TypeError("unsupported type")

  if (Buffer.isBuffer(val)) {
    if (isByteLenPrefix) {
      return Buffer.concat([UVarInt.encode(val.length), val])
    }
    return val
  }

  if (is.array(val)) {
    return encodeArrayBinary(fieldNum, val, isByteLenPrefix)
  }

  if (is.number(val)) {
    return encodeNumber(val)
  }

  if (is.boolean(val)) {
    return encodeBool(val)
  }

  if (is.string(val)) {
    return encodeString(val)
  }

  if (is.object(val)) {
    return encodeObjectBinary(val, isByteLenPrefix)
  }
  //TODO
  return ""
}

export const encodeObjectBinary = (obj: any, isByteLenPrefix?: boolean) => {
  const bufferArr: any[] = []

  Object.keys(obj).forEach((key, index) => {
    if (key === "aminoPrefix" || key === "version") return

    if (isDefaultValue(obj[key])) return

    if (is.array(obj[key]) && obj[key].length > 0) {
      bufferArr.push(encodeArrayBinary(index, obj[key]))
    } else {
      bufferArr.push(encodeTypeAndField(index, obj[key]))
      bufferArr.push(encodeBinary(obj[key], index, true))
    }
  })

  let bytes = Buffer.concat(bufferArr)

  // add prefix
  if (obj.aminoPrefix) {
    const prefix = Buffer.from(obj.aminoPrefix, "hex")
    bytes = Buffer.concat([prefix, bytes])
  }

  // Write byte-length prefixed.
  if (isByteLenPrefix) {
    const lenBytes = UVarInt.encode(bytes.length)
    bytes = Buffer.concat([lenBytes, bytes])
  }

  return bytes
}

export const encodeArrayBinary = (
  fieldNum: number | undefined,
  arr: any[],
  isByteLenPrefix?: boolean
) => {
  const result: any[] = []

  arr.forEach((item) => {
    result.push(encodeTypeAndField(fieldNum, item))

    if (isDefaultValue(item)) {
      result.push(Buffer.from("00", "hex"))
      return
    }

    result.push(encodeBinary(item, fieldNum, true))
  })

  //encode length
  if (isByteLenPrefix) {
    const length = result.reduce((prev, item) => prev + item.length, 0)
    result.unshift(UVarInt.encode(length))
  }

  return Buffer.concat(result)
}

const encodeTypeAndField = (index: number | undefined, field: any) => {
  index = Number(index)
  const value = ((index + 1) << 3) | typeToTyp3(field)
  return UVarInt.encode(value)
}

const isDefaultValue = (obj: any) => {
  if (obj === null) return false

  return (
    (is.number(obj) && obj === 0) ||
    (is.string(obj) && obj === "") ||
    (is.array(obj) && obj.length === 0) ||
    (is.boolean(obj) && !obj)
  )
}
