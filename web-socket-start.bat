@echo off

@echo Starting...

forever start -l "%cd%/logs/web-socket.log" -a "web-socket.js"

@echo [DONE]
@pause>nul