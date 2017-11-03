@echo off

nssm install ZneiatLrSocketFunc "C:\Program Files\nodejs\node.exe"
nssm set ZneiatLrSocketFunc AppDirectory "%cd%"
nssm set ZneiatLrSocketFunc AppParameters socket-func.js
nssm set ZneiatLrSocketFunc AppStdout "%cd%/logs/web-socket.log"
nssm set ZneiatLrSocketFunc AppStderr "%cd%/logs/web-socket-err.log"
nssm start ZneiatLrSocketFunc

IF %ERRORLEVEL% NEQ 0 GOTO ERROR
EXIT
:ERROR
echo.
echo Get help here: http://nssm.cc
PAUSE > nul