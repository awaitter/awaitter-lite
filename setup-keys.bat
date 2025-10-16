@echo off
echo.
echo ============================================
echo   Code CLI - API Key Setup
echo ============================================
echo.
echo Este script te ayudara a configurar tus API keys
echo.
echo Opciones disponibles:
echo   1. OpenAI (GPT-4, GPT-3.5)
echo   2. Anthropic (Claude)
echo   3. Google (Gemini)
echo   4. Ver configuracion actual
echo   5. Salir
echo.

:menu
set /p choice="Selecciona una opcion (1-5): "

if "%choice%"=="1" goto openai
if "%choice%"=="2" goto anthropic
if "%choice%"=="3" goto google
if "%choice%"=="4" goto show
if "%choice%"=="5" goto end
echo Opcion invalida
goto menu

:openai
echo.
set /p OPENAI_KEY="Ingresa tu OpenAI API key: "
if defined OPENAI_KEY (
    setx OPENAI_API_KEY "%OPENAI_KEY%" >nul
    echo [OK] OpenAI API key guardada
    echo.
    echo Obtener key: https://platform.openai.com/api-keys
    echo Usar: code-cli --model gpt4
)
goto menu

:anthropic
echo.
set /p ANTHROPIC_KEY="Ingresa tu Anthropic API key: "
if defined ANTHROPIC_KEY (
    setx ANTHROPIC_API_KEY "%ANTHROPIC_KEY%" >nul
    echo [OK] Anthropic API key guardada
    echo.
    echo Obtener key: https://console.anthropic.com/
    echo Usar: code-cli --model claude
)
goto menu

:google
echo.
set /p GOOGLE_KEY="Ingresa tu Google API key: "
if defined GOOGLE_KEY (
    setx GOOGLE_API_KEY "%GOOGLE_KEY%" >nul
    echo [OK] Google API key guardada
    echo.
    echo Obtener key: https://makersuite.google.com/app/apikey
    echo Usar: code-cli --model gemini
)
goto menu

:show
echo.
echo === Configuracion Actual ===
if defined OPENAI_API_KEY (
    echo [OK] OPENAI_API_KEY: %OPENAI_API_KEY:~0,8%...
) else (
    echo [ ] OPENAI_API_KEY: no configurada
)
if defined ANTHROPIC_API_KEY (
    echo [OK] ANTHROPIC_API_KEY: %ANTHROPIC_API_KEY:~0,8%...
) else (
    echo [ ] ANTHROPIC_API_KEY: no configurada
)
if defined GOOGLE_API_KEY (
    echo [OK] GOOGLE_API_KEY: %GOOGLE_API_KEY:~0,8%...
) else (
    echo [ ] GOOGLE_API_KEY: no configurada
)
echo.
goto menu

:end
echo.
echo ============================================
echo   Configuracion completa!
echo ============================================
echo.
echo IMPORTANTE: Cierra y vuelve a abrir tu terminal
echo para que los cambios tengan efecto.
echo.
echo Ejemplos de uso:
echo   code-cli --model gpt4
echo   code-cli --model claude
echo   code-cli --model gemini
echo   code-cli --model local
echo.
pause
