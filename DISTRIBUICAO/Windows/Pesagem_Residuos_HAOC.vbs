' =====================================================================
' PESAGEM DE RESIDUOS HAOC - LAUNCHER SILENCIOSO (SEM JANELA DE COMANDO)
' Hospital Alemao Oswaldo Cruz
' =====================================================================
Option Explicit
Dim WshShell, fso, browserPath, appUrl

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

appUrl = "http://localhost:3000"

' Localiza Microsoft Edge ou Google Chrome para rodar como Aplicativo Nativo
browserPath = ""
If fso.FileExists(WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%MicrosoftEdgeApplicationmsedge.exe")) Then
    browserPath = """" & WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%MicrosoftEdgeApplicationmsedge.exe") & """"
ElseIf fso.FileExists(WshShell.ExpandEnvironmentStrings("%ProgramFiles%MicrosoftEdgeApplicationmsedge.exe")) Then
    browserPath = """" & WshShell.ExpandEnvironmentStrings("%ProgramFiles%MicrosoftEdgeApplicationmsedge.exe") & """"
ElseIf fso.FileExists(WshShell.ExpandEnvironmentStrings("%ProgramFiles%GoogleChromeApplicationchrome.exe")) Then
    browserPath = """" & WshShell.ExpandEnvironmentStrings("%ProgramFiles%GoogleChromeApplicationchrome.exe") & """"
ElseIf fso.FileExists(WshShell.ExpandEnvironmentStrings("%LocalAppData%GoogleChromeApplicationchrome.exe")) Then
    browserPath = """" & WshShell.ExpandEnvironmentStrings("%LocalAppData%GoogleChromeApplicationchrome.exe") & """"
End If

If browserPath <> "" Then
    WshShell.Run browserPath & " --app=" & appUrl & " --window-size=1280,820", 1, False
Else
    WshShell.Run appUrl, 1, False
End If
