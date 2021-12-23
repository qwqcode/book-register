@echo off

nssm restart BookRegisterWS

IF %ERRORLEVEL% NEQ 0 GOTO ERROR
EXIT
:ERROR
echo.
echo Get help here: http://nssm.cc
PAUSE > nul