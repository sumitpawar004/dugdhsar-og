// Cloudflare Workers ke liye iconv-lite ka halka replacement.
// body-parser/raw-body ko sirf itna hi chahiye.

function exists(enc: string): boolean {
  try {
    new TextDecoder(enc);
    return true;
  } catch {
    return false;
  }
}

export function encodingExists(enc: string): boolean {
  return exists(enc);
}

export function decode(buf: any, enc?: string): string {
  return new TextDecoder(enc || "utf-8").decode(buf);
}

export function encode(str: string, _enc?: string): any {
  return new TextEncoder().encode(str);
}

export function getDecoder(enc?: string): any {
  const d = new TextDecoder(enc || "utf-8");
  return {
    write: (chunk: any) => d.decode(chunk, { stream: true }),
    end: () => d.decode() || undefined,
  };
}

const iconv = { encodingExists, decode, encode, getDecoder };
export default iconv;
