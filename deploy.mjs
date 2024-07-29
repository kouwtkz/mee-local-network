import childProcess from "child_process";

console.log("Upload to Raspberry pi Server…");

const startTime = performance.now();

let buf;
switch (process.platform) {
  case "win32":
    buf = childProcess.execSync("wsl -e bash deploy.bash");
    break;
  case "linux":
    buf = childProcess.execSync("bash deploy.bash");
    break
}
if (buf) {
  const strBuf = String(buf);
  if (strBuf) console.log(strBuf);
}

const endTime = performance.now();

const totalSec = Math.round((endTime - startTime) / 1e2) / 10;
console.log(totalSec.toPrecision(2) + "s");
