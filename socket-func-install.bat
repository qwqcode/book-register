@echo off

nssm install BookRegisterWS "C:\Program Files\nodejs\node.exe"
nssm set BookRegisterWS AppDirectory "%cd%"
nssm set BookRegisterWS AppParameters socket-func.js
nssm set BookRegisterWS AppStdout "%cd%/storage/logs/web-socket.log"
nssm set BookRegisterWS AppStderr "%cd%/storage/logs/web-socket-err.log"
nssm start BookRegisterWS

IF %ERRORLEVEL% NEQ 0 GOTO ERROR
EXIT
:ERROR
echo.
echo Get help here: http://nssm.cc
PAUSE > nul