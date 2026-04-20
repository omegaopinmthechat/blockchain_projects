!include "nsDialogs.nsh"
!include "LogicLib.nsh"
!include "WinMessages.nsh"

Var RepairPageDialog
Var RepairPageRepairRadio
Var RepairPageUninstallRadio
Var ExistingInstallPath
Var ExistingInstallDetected
Var CleanupCandidate
Var InstallFinished

!macro customInit
  StrCpy $ExistingInstallDetected "0"
  StrCpy $CleanupCandidate "0"
  StrCpy $InstallFinished "0"
!macroend

!macro customWelcomePage
  Page custom RepairOrUninstallPageCreate RepairOrUninstallPageLeave
!macroend

Function RepairOrUninstallPageCreate
  !insertmacro MUI_HEADER_TEXT "Setup Options" "Install, repair, or remove $(^Name)"

  nsDialogs::Create 1018
  Pop $RepairPageDialog
  ${If} $RepairPageDialog == error
    Abort
  ${EndIf}

  StrCpy $ExistingInstallPath ""
  ReadRegStr $ExistingInstallPath HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation
  ${If} $ExistingInstallPath == ""
    ReadRegStr $ExistingInstallPath HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation
  ${EndIf}

  ${If} $ExistingInstallPath == ""
    ${NSD_CreateLabel} 0u 0u 290u 36u "This wizard will install $(^Name) on your computer."
    Pop $0
  ${Else}
    StrCpy $ExistingInstallDetected "1"

    ${NSD_CreateLabel} 0u 0u 290u 36u "An existing installation was found at:$\r$\n$ExistingInstallPath"
    Pop $0

    ${NSD_CreateRadioButton} 0u 46u 290u 14u "Repair (reinstall and keep your settings)"
    Pop $RepairPageRepairRadio

    ${NSD_CreateRadioButton} 0u 66u 290u 14u "Uninstall existing app and exit setup"
    Pop $RepairPageUninstallRadio

    SendMessage $RepairPageRepairRadio ${BM_SETCHECK} ${BST_CHECKED} 0
  ${EndIf}

  nsDialogs::Show
FunctionEnd

Function RepairOrUninstallPageLeave
  ${If} $ExistingInstallDetected != "1"
    Return
  ${EndIf}

  SendMessage $RepairPageUninstallRadio ${BM_GETCHECK} 0 0 $0
  ${If} $0 != ${BST_CHECKED}
    Return
  ${EndIf}

  InitPluginsDir

  Push "HKEY_CURRENT_USER"
  Call uninstallOldVersion
  Push "HKEY_CURRENT_USER"
  Call handleUninstallResult

  Push "HKEY_LOCAL_MACHINE"
  Call uninstallOldVersion
  Push "HKEY_LOCAL_MACHINE"
  Call handleUninstallResult

  MessageBox MB_OK|MB_ICONINFORMATION "$(^Name) has been uninstalled. Setup will now exit."
  Quit
FunctionEnd

!macro customPageAfterChangeDir
  Page custom MarkInstallBeginCreate MarkInstallBeginLeave
!macroend

Function MarkInstallBeginCreate
  StrCpy $CleanupCandidate "1"
  Abort
FunctionEnd

Function MarkInstallBeginLeave
FunctionEnd

!macro customInstall
  StrCpy $InstallFinished "1"
  StrCpy $CleanupCandidate "0"
!macroend

Function .onUserAbort
  ${If} $CleanupCandidate != "1"
    Return
  ${EndIf}

  ${If} $InstallFinished == "1"
    Return
  ${EndIf}

  ${If} $ExistingInstallDetected == "1"
    MessageBox MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON2 "Setup was canceled.$\r$\n$\r$\nDo you want to remove files currently in:$\r$\n$INSTDIR$\r$\n$\r$\nChoose No to keep previous installation files." IDYES doCleanup IDNO done
  ${EndIf}

doCleanup:
  IfFileExists "$INSTDIR\*.*" 0 done
  RMDir /r "$INSTDIR"

done:
FunctionEnd
