import URLBase64 from "../base64_url.mjs";
import STDBase64 from "../base64_std.mjs";

// some basic tests;

var inputString = "随便来点中文，和特殊字符，😈=-=o:\":"
console.log("raw string:   ", inputString);

var input = new TextEncoder().encode(inputString);
var str = URLBase64.encodeToString(input);
console.log("url base64:   ", str);

var decoded = URLBase64.decodeString(str);
var outputString = new TextDecoder().decode(decoded);
console.log("url debase64: ", outputString);

if (inputString != outputString) {
    throw new Error("bad URL base64, input and output was not match")
} else {
    console.log("basic test URL base64 success.")
}




// test std base64;
console.log("=========================================================")
var inputString = `curl -XGET 'https://swc-1.svc.tiamat.world/x/v1/watermark?image_url=https://static.runoob.com/images/demo/demo2.jpg', 在来点变态的中文 {"hello":"["接口是多久", "健康水的👋"]"}`;
console.log("raw string:   ", inputString);

var input = new TextEncoder().encode(inputString);
var str = STDBase64.encodeToString(input);
console.log("std base64:   ", str);

var decoded = STDBase64.decodeString(str);
var outputString = new TextDecoder().decode(decoded);
console.log("std debase64: ", outputString);

if (inputString != outputString) {
    throw new Error("bad STD base64, input and output was not match")
} else {
    console.log("basic test STD base64 success.")
}




// test STD and URL base64 mixed used;
console.log("============================================================")
var inputString = `b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
NhAAAAAwEAAQAAAYEAqNNRQEHpmsebld+wo4Hx0KJSHpAxas4tsPeObUj8G83/HwHdLBxl
vCl203Qk6P/XRrqB6ZBS/GL0xSPc+hwTFuaS/eU4/7IV5KNokrnvPZxNIFaSXmoT16kcB0
RjKAK+kL/inKMkFuZU0PajyJ449b6HZSlZ1TNIzar1u77bexQD0i0pXlzVO9Ct0wr95NUF
M3RLkIZ6w9nhpLmv8/xsAGEbVsAflAAUQ/aXCjmSgT3kQ5PPFuOxNBJMUKMCjVhDVx/hJU
+33KENNGw0G2BCGDNaCkfI/FH/c++uULhxZ0edesvpeYv7iYm1vo/he7Zch5yJtLhDT7L5
9WbC8q1xbr5TUmG4j1y4bjAe2H8xxvIwiJs/A3agXHIu+xvyYELSJbyLSbXi0E36+S2SFw
4XY4EU76Nwp2BY/axdbgLQ4SSnndwFJpI860q1o7CUstmX45G9vF0V5qDBJVGMlPVKGfHX
WlHF3XtUkqZsgfwAgZSRpRYKD54MzKIrDia5s+j7AAAFkBRQIxIUUCMSAAAAB3NzaC1yc2
EAAAGBAKjTUUBB6ZrHm5XfsKOB8dCiUh6QMWrOLbD3jm1I/BvN/x8B3SwcZbwpdtN0JOj/
10a6gemQUvxi9MUj3PocExbmkv3lOP+yFeSjaJK57z2cTSBWkl5qE9epHAdEYygCvpC/4p
yjJBbmVND2o8ieOPW+h2UpWdUzSM2q9bu+23sUA9ItKV5c1TvQrdMK/eTVBTN0S5CGesPZ
4aS5r/P8bABhG1bAH5QAFEP2lwo5koE95EOTzxbjsTQSTFCjAo1YQ1cf4SVPt9yhDTRsNB
tgQhgzWgpHyPxR/3PvrlC4cWdHnXrL6XmL+4mJtb6P4Xu2XIecibS4Q0+y+fVmwvKtcW6+
U1JhuI9cuG4wHth/McbyMIibPwN2oFxyLvsb8mBC0iW8i0m14tBN+vktkhcOF2OBFO+jcK
dgWP2sXW4C0OEkp53cBSaSPOtKtaOwlLLZl+ORvbxdFeagwSVRjJT1Shnx11pRxd17VJKm
bIH8AIGUkaUWCg+eDMyiKw4mubPo+wAAAAMBAAEAAAGAKQRSWMTKz0aQx+x1e3w+NnzBa9
iHkRXvpu+2ZFnXmp/FTJDE3gs2Mm12h7BPqWZDNNVqa8cbSmN2aZEphoCcqLMzYkk3PHRV
eluzM/bFp9faKzGtVQ/7qylUfHWCi72C9CMSmRDP21pxn+VUbJD4cMguGAdgYnqXxRQ0qL
0ZkQEPXpiHVPxD+EjeeohQoDCbF2G5XC84E25TspREqggZa0wserqp0Wjlg4+dKahMLmdN
lpeKOFrweiC59ttr6tBXAle5R1VC0uFG1yhx+NmgE4G+tvaPaPlSlAeyLa+Hm3isreMVi6
9fBqX2MHSpQA+jQR41KEMNP4g7VUjt2eG/mcksr7N7y4ZNe+sXokheGK7aDfqRmuDeN9jf
C6tIDHjPzpXGLPAvzZgC3423xBC56fi+5/2QOU4GPanFuaFnSKAETVMUg2q89SeCrx5WDx
fBMXKBkBYiG/te8bQH5PvJg6vFd2Y3XogeDDXTR9KS81B2LcFDCnILgm+m4Q6srMSNAAAA
wQCpFgAJ/1sgpOATvDg2sVQPVpSMZu4lcJ5r8rGrcy6PsF8ApAQiNjs6FFx+7PxxUXJODH
XbVqsH8tJ3MuCH+QdLOgG0zkXZh2R0w/miCUdXHyuokPbJowGeg+MnEmKZ6iTrmGsdwNbl
Tjd6efoObGjtBcclrDEhiayqG+UCCGS7mvOeKd2K5GEGIg6FpFrClZR+OSIXTcqFZLgGub
AFsBE4RV2nCkqXCO3Ucr0sDZiXO7CJcs0O34zmOAIrkdePKEEAAADBALkTFWIFTt4DPqUp
E5taH4n+dkZNkn1nv5Aa5uCaC4cdFAgLiM/uxEHsqy9zZBjszPIOnf0KIIg5ceXswO2vHB
YKH2APr7y6ClVzaTFL20Osf7XvugQ/Ke2b8oUwAhh2QtbEh0y+1eXGnMf6fXW/tu8dGdmg
z7MoPZ3CXnY78z4zlK83yemhNKKYaqFrwZFbxnx8Dozz/rotJoaOH987tDPN7lVramtaeP
LuuBkMAdDqSLUHg1NCDVh+K0ofyhchHwAAAMEA6YYaAUMf1Hd3M5bwV5QYhVGDR2KwX6G8
zSYfKSfa5gGFEvaZ74e1WJeFZ0PBtppmPm3RHf0JskSxlt9JzV7XU9odcIVhFQkYk6zneP
HIR25jVpxx9ipNJDndTZXEBaQOHckIJh5bY0KzKahU1zD4fe4hxgoV3ctpZchCIoBwIS4r
yohSo7MBhFRu1hpDhC40KnOq2cjdAITjjmeP53NuBLtck33YwLecYFUlwa6BW1dfFN41IR
HfHQMTFoWV8nClAAAAGXVidW50dUB0aWFzeXMtd3hiYWNrZW5kLTEB`


var decoded = STDBase64.decodeString(inputString);

var ouputString = URLBase64.encodeToString(decoded);

var includePlus = outputString.includes("+");
if (includePlus == true) {
    throw new Error("The output string must not contain a plus sign");
}

console.log("basic mixed test STD and URL base64 success.")
