@echo off

nssm restart ZneiatLrSocketFunc

IF %ERRORLEVEL% NEQ 0 GOTO ERROR
EXIT
:ERROR
echo.
echo Get help here: http://nssm.cc
PAUSE > nul