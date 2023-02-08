import Base64 from './base64.mjs';

const URLBase64 = new Base64("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_");
URLBase64.withNoPadding();

export default URLBase64;

