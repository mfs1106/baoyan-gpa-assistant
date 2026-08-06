Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "node.exe server.cjs", 0, False
WScript.Sleep 2000
WshShell.Run "http://localhost:3000", 1, False
