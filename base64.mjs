class Base64 {
    noPadding = "-1";
    stdPadding = "=";

    constructor(encoder) {
        if (encoder.length != 64) {
            throw new Error("encoding alphabet is not 64-bytes long");
        }
        for (let i = 0; i < encoder.length; i++) {
            if (encoder.charAt(i) == '\n' || encoder.charAt(i) == '\r') {
                throw new Error("encoding alphabet contains newline character");
            }
        }

        var decodeMap = new Uint8Array(256);
        for (let i = 0; i < decodeMap.length; i++) {
            decodeMap[i] = 0xFF
        }
        for (let i = 0; i < encoder.length; i++) {
            var c = encoder.charCodeAt(i);
            decodeMap[c] = i;
        }

        this.padChar = this.stdPadding;
        this.encoder = encoder;
        this.decodeMap = decodeMap;
        this.strict = false;
    }

    withNoPadding() {
        this.padChar = this.noPadding;
    }

    withStdPadding() {
        this.padChar = this.stdPadding;
    }

    // encodeToString(src Uint8Array) String
    encodeToString(src) {
        const type = typeof src
        if (type == "string") {
            throw new Error("input cannot be string, it must be uint8 array")
        }
        var uint8array = this._encode(src);
        return String.fromCharCode(...uint8array);
    }

    // decodeString(s String) Uint8Array
    decodeString(s) {
        const type = typeof s
        if (type != "string") {
            throw new Error("input must be string")
        }

        var src = new TextEncoder().encode(s);
        if (src.length == 0) {
            return new Uint8Array(0);
        }

        var buffSize = this.decodeLength(src.length);
        var dst = new Uint8Array(buffSize);

        var si = 0;
        var n = 0;
        while (src.length-si >= 8 && buffSize-n >= 8) {
            var rt = this._assemble64(
                this.decodeMap[src[si+0]],
                this.decodeMap[src[si+1]],
                this.decodeMap[src[si+2]],
                this.decodeMap[src[si+3]],
                this.decodeMap[src[si+4]],
                this.decodeMap[src[si+5]],
                this.decodeMap[src[si+6]],
                this.decodeMap[src[si+7]],
            )
            if (rt.ok === true) {
                var bitarray = rt.bitarray;
                dst[n+0] = this._uint64BitArrayByteValue(bitarray, 56, 63) & 0xFF;
                dst[n+1] = this._uint64BitArrayByteValue(bitarray, 48, 55) & 0xFF;
                dst[n+2] = this._uint64BitArrayByteValue(bitarray, 40, 47) & 0xFF;
                dst[n+3] = this._uint64BitArrayByteValue(bitarray, 32, 39) & 0xFF;
                dst[n+4] = this._uint64BitArrayByteValue(bitarray, 24, 31) & 0xFF;;
                dst[n+5] = this._uint64BitArrayByteValue(bitarray, 16, 23) & 0xFF;;
                dst[n+6] = this._uint64BitArrayByteValue(bitarray, 8, 15) & 0xFF;;
                dst[n+7] = this._uint64BitArrayByteValue(bitarray, 0, 7) & 0xFF;;
                n = n + 6;
                si = si + 8;
            } else {
                var rt = this._decodeQuantum(dst, n, src, si);
                n = n + rt.n
            }
        }

        while (src.length-si >= 4 && dst.length-n >= 4) {
            var rt = this._assemble32(
                this.decodeMap[src[si+0]],
                this.decodeMap[src[si+1]],
                this.decodeMap[src[si+2]],
                this.decodeMap[src[si+3]],
            );
            if (rt.ok === true) {
                var bitarray = rt.bitarray;
                dst[n+0] = this._uint64BitArrayByteValue(bitarray, 24, 31) & 0xFF;
                dst[n+1] = this._uint64BitArrayByteValue(bitarray, 16, 23) & 0xFF;
                dst[n+2] = this._uint64BitArrayByteValue(bitarray, 8, 15) & 0xFF;
                dst[n+3] = this._uint64BitArrayByteValue(bitarray, 0, 7) & 0xFF;
                n = n + 3;
                si = si + 4;
            } else {
                var rt = this._decodeQuantum(dst, n, src, si);
                n = n + rt.n;
            }
        }

        while (si < src.length) {
            var rt = this._decodeQuantum(dst, n, src, si)
            n = n + rt.n
            break
        }

        var returnBuff = new Uint8Array(n)
        for (let i = 0; i < n && i < dst.length; i++) {
            returnBuff[i] = dst[i]
        }
        return returnBuff
    }

    // _encode(src Uint8Array) Uint8Array
    _encode(src) {
        if (src.length == 0) {
            return new Uint8Array(0);
        }

        var buffSize = this.encodeLength(src.length)
        var buff = new Uint8Array(buffSize);

        var di = 0
        var si = 0
        var n = Math.floor(src.length / 3) * 3
        while (si < n) {
            // Convert 3x 8bit source bytes into 4 bytes;
            var val = (src[si+0] << 16) | (src[si+1] << 8) | src[si+2];

            buff[di+0] = this.encoder.charCodeAt((val >> 18) & 0x3F);
            buff[di+1] = this.encoder.charCodeAt((val >> 12) & 0x3F);
            buff[di+2] = this.encoder.charCodeAt((val >> 6) & 0x3F);
            buff[di+3] = this.encoder.charCodeAt(val & 0x3F);

            si += 3;
            di += 4;
        }

        var remain = src.length - si
        if (remain == 0) {
            return buff
        }
        // Add the remaining small block;
        var val = (src[si+0] << 16)
        if (remain == 2) {
            val = (val | src[si+1] << 8)
        }

        buff[di+0] = this.encoder.charCodeAt((val >> 18) & 0x3F)
        buff[di+1] = this.encoder.charCodeAt((val >> 12) & 0x3F)

        switch (remain) {
        case 2:
            buff[di+2] = this.encoder.charCodeAt((val >> 6) & 0x3F)
            if (this.padChar != this.noPadding) {
                buff[di+3] = this.padChar.charCodeAt(0);
            }
            break;
        case 1:
            if (this.padChar != this.noPadding) {
                buff[di+2] = this.padChar.charCodeAt(0);
                buff[di+3] = this.padChar.charCodeAt(0);
            }
            break;
        }
        return buff
    }

    // encodeLength(n int) int
    encodeLength(n) {
        if (this.padChar == this.noPadding) {
            return Math.floor((n * 8 + 5) / 6); // mininum # chars at 6 bits per char.
        }
        return Math.floor((n + 2) / 3) * 4; // minium # 4-char quanta, 3 bytes each.
    }

    // decodeLength(n int) int
    decodeLength(n) {
        if (this.padChar == this.noPadding) {
            // Unpadded data my end with partial block of 2-3 characters;
            return Math.floor(n * 6 / 8)
        }
        // Padded base64 should always be a multiple of 4 characters in length.
        return Math.floor(n / 4) * 3
    }

    // _assemble64(n1, n2, n3, n4, n5, n6, n7, n8 uint8) (bitarray Uint8Array, ok bool)
    _assemble64(n1, n2, n3, n4, n5, n6, n7, n8) {
        //console.log(n1, "  ", n2, "  ", n3, "  ", n4, "  ", n5, "  ", n6, "  ", n7, "  ", n8)
        if ((n1 | n2 | n3 | n4 | n5 | n6 | n7 | n8) == 0xff) {
            return {
                dn: null,
                ok: false
            }
        }
        var bitarray = new Uint8Array(64)
        for (let i = 0; i < bitarray.length; i++) {
            bitarray[i] = 0x00
        }

        // set bits for n1
        if ((n1 & (1 << 0)) > 0) {
            bitarray[58 + 0] = 0x01
        }
        if ((n1 & (1 << 1)) > 0) {
            bitarray[58 + 1] = 0x01
        }
        if ((n1 & (1 << 2)) > 0) {
            bitarray[58 + 2] = 0x01
        }
        if ((n1 & (1 << 3)) > 0) {
            bitarray[58 + 3] = 0x01
        }
        if ((n1 & (1 << 4)) > 0) {
            bitarray[58 + 4] = 0x01
        }
        if ((n1 & (1 << 5)) > 0) {
            bitarray[58 + 5] = 0x01
        }
        if ((n1 & (1 << 6)) > 0) {
            bitarray[58 + 6] = 0x01
        }
        if ((n1 & (1 << 7)) > 0) {
            bitarray[58 + 7] = 0x01
        }

        // set bits for n2
        if ((n2 & (1 << 0)) > 0) {
            bitarray[52 + 0] = 0x01
        }
        if ((n2 & (1 << 1)) > 0) {
            bitarray[52 + 1] = 0x01
        }
        if ((n2 & (1 << 2)) > 0) {
            bitarray[52 + 2] = 0x01
        }
        if ((n2 & (1 << 3)) > 0) {
            bitarray[52 + 3] = 0x01
        }
        if ((n2 & (1 << 4)) > 0) {
            bitarray[52 + 4] = 0x01
        }
        if ((n2 & (1 << 5)) > 0) {
            bitarray[52 + 5] = 0x01
        }
        if ((n2 & (1 << 6)) > 0) {
            bitarray[52 + 6] = 0x01
        }
        if ((n2 & (1 << 7)) > 0) {
            bitarray[52 + 7] = 0x01
        }

        // set bits for n3
        if ((n3 & (1 << 0)) > 0) {
            bitarray[46 + 0] = 0x01
        }
        if ((n3 & (1 << 1)) > 0) {
            bitarray[46 + 1] = 0x01
        }
        if ((n3 & (1 << 2)) > 0) {
            bitarray[46 + 2] = 0x01
        }
        if ((n3 & (1 << 3)) > 0) {
            bitarray[46 + 3] = 0x01
        }
        if ((n3 & (1 << 4)) > 0) {
            bitarray[46 + 4] = 0x01
        }
        if ((n3 & (1 << 5)) > 0) {
            bitarray[46 + 5] = 0x01
        }
        if ((n3 & (1 << 6)) > 0) {
            bitarray[46 + 6] = 0x01
        }
        if ((n3 & (1 << 7)) > 0) {
            bitarray[46 + 7] = 0x01
        }

        // set bits for n4
        if ((n4 & (1 << 0)) > 0) {
            bitarray[40 + 0] = 0x01
        }
        if ((n4 & (1 << 1)) > 0) {
            bitarray[40 + 1] = 0x01
        }
        if ((n4 & (1 << 2)) > 0) {
            bitarray[40 + 2] = 0x01
        }
        if ((n4 & (1 << 3)) > 0) {
            bitarray[40 + 3] = 0x01
        }
        if ((n4 & (1 << 4)) > 0) {
            bitarray[40 + 4] = 0x01
        }
        if ((n4 & (1 << 5)) > 0) {
            bitarray[40 + 5] = 0x01
        }
        if ((n4 & (1 << 6)) > 0) {
            bitarray[40 + 6] = 0x01
        }
        if ((n4 & (1 << 7)) > 0) {
            bitarray[40 + 7] = 0x01
        }

        // set bits for n5
        if ((n5 & (1 << 0)) > 0) {
            bitarray[34 + 0] = 0x01
        }
        if ((n5 & (1 << 1)) > 0) {
            bitarray[34 + 1] = 0x01
        }
        if ((n5 & (1 << 2)) > 0) {
            bitarray[34 + 2] = 0x01
        }
        if ((n5 & (1 << 3)) > 0) {
            bitarray[34 + 3] = 0x01
        }
        if ((n5 & (1 << 4)) > 0) {
            bitarray[34 + 4] = 0x01
        }
        if ((n5 & (1 << 5)) > 0) {
            bitarray[34 + 5] = 0x01
        }
        if ((n5 & (1 << 6)) > 0) {
            bitarray[34 + 6] = 0x01
        }
        if ((n5 & (1 << 7)) > 0) {
            bitarray[34 + 7] = 0x01
        }

        // set bits for n6
        if ((n6 & (1 << 0)) > 0) {
            bitarray[28 + 0] = 0x01
        }
        if ((n6 & (1 << 1)) > 0) {
            bitarray[28 + 1] = 0x01
        }
        if ((n6 & (1 << 2)) > 0) {
            bitarray[28 + 2] = 0x01
        }
        if ((n6 & (1 << 3)) > 0) {
            bitarray[28 + 3] = 0x01
        }
        if ((n6 & (1 << 4)) > 0) {
            bitarray[28 + 4] = 0x01
        }
        if ((n6 & (1 << 5)) > 0) {
            bitarray[28 + 5] = 0x01
        }
        if ((n6 & (1 << 6)) > 0) {
            bitarray[28 + 6] = 0x01
        }
        if ((n6 & (1 << 7)) > 0) {
            bitarray[28 + 7] = 0x01
        }

        // set bits for n7
        if ((n7 & (1 << 0)) > 0) {
            bitarray[22 + 0] = 0x01
        }
        if ((n7 & (1 << 1)) > 0) {
            bitarray[22 + 1] = 0x01
        }
        if ((n7 & (1 << 2)) > 0) {
            bitarray[22 + 2] = 0x01
        }
        if ((n7 & (1 << 3)) > 0) {
            bitarray[22 + 3] = 0x01
        }
        if ((n7 & (1 << 4)) > 0) {
            bitarray[22 + 4] = 0x01
        }
        if ((n7 & (1 << 5)) > 0) {
            bitarray[22 + 5] = 0x01
        }
        if ((n7 & (1 << 6)) > 0) {
            bitarray[22 + 6] = 0x01
        }
        if ((n7 & (1 << 7)) > 0) {
            bitarray[22 + 7] = 0x01
        }

        // set bits for n8
        if ((n8 & (1 << 0)) > 0) {
            bitarray[16 + 0] = 0x01
        }
        if ((n8 & (1 << 1)) > 0) {
            bitarray[16 + 1] = 0x01
        }
        if ((n8 & (1 << 2)) > 0) {
            bitarray[16 + 2] = 0x01
        }
        if ((n8 & (1 << 3)) > 0) {
            bitarray[16 + 3] = 0x01
        }
        if ((n8 & (1 << 4)) > 0) {
            bitarray[16 + 4] = 0x01
        }
        if ((n8 & (1 << 5)) > 0) {
            bitarray[16 + 5] = 0x01
        }
        if ((n8 & (1 << 6)) > 0) {
            bitarray[16 + 6] = 0x01
        }
        if ((n8 & (1 << 7)) > 0) {
            bitarray[16 + 7] = 0x01
        }

        return {
            bitarray: bitarray,
            ok: true
        }
    }

    // _assemble32(n1, n2, n3, n4 uint8) (bitarray Uint8Array, ok bool)
    _assemble32(n1, n2, n3, n4) {
        if ((n1 | n2 | n3 | n4) == 0xFF) {
            return {dn: 0, ok: false}
        }

        var bitarray = new Uint8Array(32)
        for (let i = 0; i < bitarray.length; i++) {
            bitarray[i] = 0x00
        }

        // set bits for n1
        if ((n1 & (1 << 0)) > 0) {
            bitarray[26 + 0] = 0x01
        }
        if ((n1 & (1 << 1)) > 0) {
            bitarray[26 + 1] = 0x01
        }
        if ((n1 & (1 << 2)) > 0) {
            bitarray[26 + 2] = 0x01
        }
        if ((n1 & (1 << 3)) > 0) {
            bitarray[26 + 3] = 0x01
        }
        if ((n1 & (1 << 4)) > 0) {
            bitarray[26 + 4] = 0x01
        }
        if ((n1 & (1 << 5)) > 0) {
            bitarray[26 + 5] = 0x01
        }
        if ((n1 & (1 << 6)) > 0) {
            bitarray[26 + 6] = 0x01
        }
        if ((n1 & (1 << 7)) > 0) {
            bitarray[26 + 7] = 0x01
        }

         // set bits for n2
         if ((n2 & (1 << 0)) > 0) {
            bitarray[20 + 0] = 0x01
        }
        if ((n2 & (1 << 1)) > 0) {
            bitarray[20 + 1] = 0x01
        }
        if ((n2 & (1 << 2)) > 0) {
            bitarray[20 + 2] = 0x01
        }
        if ((n2 & (1 << 3)) > 0) {
            bitarray[20 + 3] = 0x01
        }
        if ((n2 & (1 << 4)) > 0) {
            bitarray[20 + 4] = 0x01
        }
        if ((n2 & (1 << 5)) > 0) {
            bitarray[20 + 5] = 0x01
        }
        if ((n2 & (1 << 6)) > 0) {
            bitarray[20 + 6] = 0x01
        }
        if ((n2 & (1 << 7)) > 0) {
            bitarray[20 + 7] = 0x01
        }

        // set bits for n3
        if ((n3 & (1 << 0)) > 0) {
            bitarray[14 + 0] = 0x01
        }
        if ((n3 & (1 << 1)) > 0) {
            bitarray[14 + 1] = 0x01
        }
        if ((n3 & (1 << 2)) > 0) {
            bitarray[14 + 2] = 0x01
        }
        if ((n3 & (1 << 3)) > 0) {
            bitarray[14 + 3] = 0x01
        }
        if ((n3 & (1 << 4)) > 0) {
            bitarray[14 + 4] = 0x01
        }
        if ((n3 & (1 << 5)) > 0) {
            bitarray[14 + 5] = 0x01
        }
        if ((n3 & (1 << 6)) > 0) {
            bitarray[14 + 6] = 0x01
        }
        if ((n3 & (1 << 7)) > 0) {
            bitarray[14 + 7] = 0x01
        }

        // set bits for n4
        if ((n4 & (1 << 0)) > 0) {
            bitarray[8 + 0] = 0x01
        }
        if ((n4 & (1 << 1)) > 0) {
            bitarray[8 + 1] = 0x01
        }
        if ((n4 & (1 << 2)) > 0) {
            bitarray[8 + 2] = 0x01
        }
        if ((n4 & (1 << 3)) > 0) {
            bitarray[8 + 3] = 0x01
        }
        if ((n4 & (1 << 4)) > 0) {
            bitarray[8 + 4] = 0x01
        }
        if ((n4 & (1 << 5)) > 0) {
            bitarray[8 + 5] = 0x01
        }
        if ((n4 & (1 << 6)) > 0) {
            bitarray[8 + 6] = 0x01
        }
        if ((n4 & (1 << 7)) > 0) {
            bitarray[8 + 7] = 0x01
        }

        return {
            bitarray: bitarray,
            ok: true
        }
    }

    // _decodeQuantum(dst Uint8Array, dstIndex int, src Uint8Array, si int) {nsi, n int}
    _decodeQuantum(dst, dstIndex, src, si) {
        var dbuf = new Uint8Array(4)
        var dlen = 4

        for (let j = 0; j < dbuf.length; j++) {
            if (src.length == si) {
                if (j == 0) {
                    return {
                        nsi: si,
                        n: 0,
                        err: ""
                    }
                }
                if (j == 1 || this.padChar != this.noPadding) {
                    throw new Error("illegal base64 data at input byte " + si - j);
                }
                dlen = j;
                break;
            }
            var inCode = src[si];
            si++;

            var out = this.decodeMap[inCode];
            if (out != 0xFF) {
                dbuf[j] = out;
                continue
            }

            if (inCode == 13 || inCode == 10) { // \n or \r
                j--;
                continue
            }

            if (inCode != this.padChar.charCodeAt(0)) {
                throw new Error("illegal base64 data at input byte " + si - 1);
            }

            // We've reached the end and there's padding
            switch (j) {
            case 0:
                // incorrent padding
                throw new Error("illegal base64 data at input byte " + si - 1);
            case 1:
                // incorrent padding
                throw new Error("illegal base64 data at input byte " + si - 1);
            case 2:
                // "==" is expected, the first "=" is already consumed.
                // skip over newlines;
                while (si < src.length && (src[si] == 10 || src[si] == 13)) {
                    si++;
                }
                if (si == src.length) {
                    // not enough padding;
                    throw new Error("illegal base64 data at input byte " + src.length)
                }
                if (src.charAt(si) != this.padChar.charAt(0)) {
                    // incorrect padding
                    throw new Error("illegal base64 data at input byte " + si - 1)
                }

                si++
            }

            // skip over newlines
            while (si < src.length && (src[si] == 10 || src[si] == 13)) {
                si++
            }
            if (si < src.length) {
                // trailing garbage
                throw new Error("illegal base64 data at input byte " + si)
            }
            dlen = j
            break
        }

        // Convert 4x 6bit source bytes into 3 bytes;
        var val = (dbuf[0]<<18) | (dbuf[1]<<12) | (dbuf[2]<<6) | dbuf[3]
        dbuf[2] = (val >> 0) & 0xff
        dbuf[1] = (val >> 8) & 0xff
        dbuf[0] = (val >> 16) & 0xff
        switch (dlen) {
        case 4:
            dst[dstIndex+2] = dbuf[2]
            dbuf[2] = 0
            // fallthrough
        case 3:
            dst[dstIndex+1] = dbuf[1]
            if (this.strict === true && dbuf[2] != 0) {
                throw new Error("illegal base64 data at input byte " + si - 1)
            }
            dbuf[1] = 0
            // fallthrough
        case 2:
            dst[dstIndex+0] = dbuf[0]
            if (this.strict === true && (dbuf[1] != 0 || dbuf[2] != 0)) {
                throw new Error("illegal base64 data at input byte " + si - 2)
            }
        }
        return {nsi: si, n: dlen-1}
    }

    _uint64BitArrayByteValue(bitarray, bitStart, bitEnd) {
        var value = 0x00
        for (let i = 0; i+bitStart <= bitEnd; i++) {
            if (bitarray[i+bitStart] == 0x01) {
                value = value | (1 << i)
            }
        } 
        return value
    }
}

export default Base64;
