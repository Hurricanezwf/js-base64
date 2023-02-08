import Base64 from './base64.mjs';

const STDBase64 = new Base64("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");
STDBase64.withStdPadding();

export default STDBase64;

