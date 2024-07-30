import childProcess from "child_process";

export function streamProcess(command: string | string[]) {
  let commands: string[];
  if (typeof command === "string") commands = command.split(" ");
  else commands = command;
  if (commands[0].toLowerCase().endsWith(".bash")) {
    commands = ["bash", commands[0]]
  };
  return new Promise<void>((resolve, reject) => {
    let proc: childProcess.ChildProcessWithoutNullStreams;
    switch (process.platform) {
      case "win32":
        proc = childProcess.spawn("wsl", ["-e"].concat(commands));
        break;
      default:
        proc = childProcess.spawn(commands[0], commands.slice(1));
        break
    }
    proc.stdout.on("data", (data) => {
      process.stdout.write(data.toString())
    });
    proc.stdout.on("end", () => {
      resolve();
    });
    proc.stderr.on("close", () => { reject() });
  });
}
